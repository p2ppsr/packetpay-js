const { Authrite } = require('authrite-js')
const bsv = require('babbage-bsv')
const { getPublicKey, createAction } = require('@babbage/sdk-ts')
const { getPaymentAddress } = require('sendover')
const { Ninja, invoice3241645161d8 } = require('ninja-base')

/**
 * @param {String} url The request URL
 * @param {Object} [fetchConfig] The fetch configuration object
 * @param {Object} [config] PacketPay configuration object, optional of Babbage SDK is used
 * @param {Object} [config.authriteConfig] Constructor parameters for Authrite
 * @param {Object} [config.ninjaConfig] Constructor parameters for Ninja
 * @param {String} [config.clientPrivateKey] Client private key, used with both Authrite and Ninja if provided
 * @param {String} [config.description] Payment description, if a non-default description is desired
 *
 * @returns {Promise<Object>} Containing `status`, `headers` and `body`
 */
module.exports = async (url, fetchConfig = {}, config = {}) => {
  // Make sure the config objects are present when privateKey is included
  if (config.clientPrivateKey) {
    if (!config.authriteConfig) {
      config.authriteConfig = {}
    }
    config.authriteConfig.clientPrivateKey = config.clientPrivateKey

    if (!config.ninjaConfig) {
      config.ninjaConfig = {}
    }
    config.ninjaConfig.privateKey = config.clientPrivateKey
  }

  if (!config.description) {
    config.description = `Pay for ${url}`
  }
  const authrite = new Authrite(config.authriteConfig)
  const firstResult = await authrite.request(url, fetchConfig)
  if (firstResult.status !== 402) return firstResult
  try {
    const satoshis = parseInt(
      firstResult.headers
        .get('x-bsv-payment-satoshis-required')
    )
    const derivationPrefix = require('crypto')
      .randomBytes(10)
      .toString('base64')
    const derivationSuffix = require('crypto')
      .randomBytes(10)
      .toString('base64')
    let derivedPublicKey
    if (config.clientPrivateKey) {
      derivedPublicKey = getPaymentAddress({
        invoiceNumber: invoice3241645161d8(derivationPrefix, derivationSuffix),
        senderPrivateKey: config.clientPrivateKey,
        recipientPublicKey: firstResult.headers.get('x-authrite-identity-key'),
        returnType: 'publicKey'
      })
    } else {
      derivedPublicKey = await getPublicKey({
        protocolID: [2, '3241645161d8'],
        keyID: `${derivationPrefix} ${derivationSuffix}`,
        counterparty: firstResult.headers.get('x-authrite-identity-key')
      })
    }
    const script = new bsv.Script(
      bsv.Script.fromAddress(bsv.Address.fromPublicKey(
        bsv.PublicKey.fromString(derivedPublicKey)
      ))
    ).toHex()
    let payment
    if (config.clientPrivateKey) {
      const ninja = new Ninja(config.ninjaConfig)
      payment = await ninja.getTransactionWithOutputs({
        outputs: [{ script, satoshis }],
        note: config.description
      })
    } else {
      payment = await createAction({
        description: config.description,
        outputs: [{ script, satoshis }]
      })
    }
    const paymentHeader = JSON.stringify({
      derivationPrefix,
      transaction: {
        ...payment,
        outputs: [{ vout: 0, satoshis, derivationSuffix }]
      }
    })
    if (!fetchConfig.headers) fetchConfig.headers = {}
    fetchConfig.headers['x-bsv-payment'] = paymentHeader
    return authrite.request(url, fetchConfig)
  } catch (e) {
    console.error(e) // temp
    return firstResult
  }
}
