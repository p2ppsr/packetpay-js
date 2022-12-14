const { Authrite } = require('authrite-js')
const bsv = require('babbage-bsv')
const { getPublicKey, createAction } = require('@babbage/sdk')

/**
 * @param {String} url The request URL
 * @param {Object} [fetchConfig] The fetch configuration object
 * @param {Object} [authriteClientParams] Constructor params for Authrite
 * 
 * @returns {Promise<Object>} Containing `status`, `headers` and `body`
 */
module.exports = async (url, fetchConfig = {}, authriteClientParams = {}) => {
  const authrite = new Authrite(authriteClientParams)
  const firstResult = await authrite.request(url, fetchConfig)
  if (firstResult.status !== 402) return firstResult
  try {
    console.log(firstResult.headers)
    const satoshis = parseInt(
      firstResult.headers
        .get('x-bsv-payment-satoshis-required')
    )
    console.log(satoshis)
    const derivationPrefix = require('crypto')
      .randomBytes(10)
      .toString('base64')
    const derivationSuffix = require('crypto')
      .randomBytes(10)
      .toString('base64')
    const derivedPublicKey = await getPublicKey({
      protocolID: [2, '3241645161d8'],
      keyID: `${derivationPrefix} ${derivationSuffix}`,
      counterparty: firstResult.headers.get('x-authrite-identity-key')
    })
    const script = new bsv.Script(
      bsv.Script.fromAddress(bsv.Address.fromPublicKey(
        bsv.PublicKey.fromString(derivedPublicKey)
      ))
    ).toHex()
    const payment = await createAction({
      description: `Pay for ${url}`,
      outputs: [{ script, satoshis }]
    })
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
