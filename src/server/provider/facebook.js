const request = require('request')
const purest = require('purest')({ request })
const logger = require('../logger')
const utils = require('../utils')

class Facebook {
    constructor (options) {
        this.authProvider = options.provider = Facebook.authProvider
        this.client = purest(options)
    }

    static get authProvider () {
        return 'facebook'
    }

    list ({ directory = 'albums', token, query = {} }, done) {
        const qs = query.max_id ? {max_id: query.max_id} : {}

        let queryString = directory === 'albums' ? 'me/albums?fields=type,picture,name,updated_time'
            : directory + '/photos?fields=picture,updated_time,name'

        this.client
            .select(queryString)
            .qs(qs)
            .auth(token)
            .request(done)
    }

    download ({ id, token, query = {}}, onData, onResponse) {
        return this.client
            .get(`${id}?fields=images`)
            .auth(token)
            .request((err, resp, body) => {
                if (err) return logger.error(err, 'provider.facebook.download.error')

                request(body.images[0].source)
                    .on('response', onResponse)
                    .on('error', (err) => {
                        logger.error(err, 'provider.facebook.download.url.error')
                    })
            })
    }

    thumbnail ({id, token}, done) {
        return this.client
            .get(`${id}?fields=picture`)
            .auth(token)
            .request((err, resp, body) => {
                if (err) return logger.error(err, 'provider.facebook.thumbnail.error')

                request(body.picture)
                    .on('response', done)
                    .on('error', (err) => {
                        logger.error(err, 'provider.facebook.thumbnail.error')
                    })
            })
    }

    size ({id, token}, done) {
        //Not found a way how to get image size from facebook
        return done()
    }
}

module.exports = Facebook
