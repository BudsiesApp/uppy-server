// oauth configuration for provider services that are used.
module.exports = () => {
  return {
    google: {
      scope: [
        'https://www.googleapis.com/auth/drive.readonly'
      ],
      callback: '/drive/callback'
    },
    dropbox: {
      authorize_url: 'https://www.dropbox.com/oauth2/authorize',
      access_url: 'https://api.dropbox.com/oauth2/token',
      callback: '/dropbox/callback'
    },
    instagram: {
      callback: '/instagram/callback'
    },
    facebook: {
      authorize_url: "https://graph.facebook.com/oauth/authorize",
      access_url: "https://graph.facebook.com/oauth/access_token",
      callback: '/facebook/callback',
      scope: [
          'user_photos'
      ],
    },
  }
}
