/**
 * oAuth callback.  Adds access token to session store
 * and redirects to original page.
 * Eventually refactor to have `state` be entire Uppy state object.
 */
var atob = require('atob')

module.exports = function * (next) {
  var providerName = this.params.providerName

  if (!this.session[providerName]) {
    this.session[providerName] = {}
  }

  this.session[providerName].token = this.query.access_token

  if (this.session.grant.state) {
    var state = JSON.parse(atob(this.session.grant.state))
    this.redirect(`${state.redirect}?state=${this.session.grant.state}`)
  } else {
    this.redirect(process.env.UPPY_ENDPOINT)
  }
}