TEST_WITH_EBAY_STUB=true
EBAY_CLIENT_ID=VamsiSri-ShopIQ-PRD-e4c54106b-d60bc6ad
EBAY_CLIENT_SECRET=PRD-4c54106b12ff-6c73-4123-ba5e-f663
EBAY_OAUTH_URL=https://api.ebay.com/identity/v1/oauth2/token
EBAY_API_URL=https://api.ebay.com/buy/browse/v1/item_summary/search

TEST_WITH_AMAZON_STUB=true
AMAZON_CANOPY_API_KEY=c50aa907-2f81-4cf0-9b79-5e8e299227d0
AMAZON_API_URL=https://rest.canopyapi.co/api/amazon/search


OLLAMA_API_URL=http://localhost:11434/api/generate

JAEGER_SERVICE_NAME=shopiq
JAEGER_AGENT_URL=http://localhost:4318/v1/traces


# EBAY Keys
# https://developer.ebay.com/my/keys
# Created API keys for sandbox and production in enay portal mentoned above.
# It requires Subscribing to eBay marketplace account deletion/closure notifications
# so had to create a small node JS app to receive those notifications and keep the subscription alive. This is required to get the refresh token for the user access token which is used to make API calls on behalf of the user.
# ebay-webhook-server project is for that really.
# the node endpoint exposed to internet by using NGROK
# grok http 3000.
# and can inspect ebay notifications by looking at http://127.0.0.1:4040/inspect/http

# this is the NGROk dashboard
# https://dashboard.ngrok.com/get-started/setup/macos

# For Amazon:
#    canopy api
#    c50aa907-2f81-4cf0-9b79-5e8e299227d0
# GET https://rest.canopyapi.co/api/amazon/search
# POST https://graphql.canopyapi.co

## 
# EBAY_DEV_ID=9cb8c4fa-3c63-47c6-9b7e-b1ce155f079c
# EBAY_ENVIRONMENT=PROD
# EBAY_REDIRECT_URI=http://<>:<>/auth/ebay/callback
# EBAY_PORT=3000
# EBAY_MONGODB_URI=mongodb://<>:27017/shopiq
# EBAY_SESSION_SECRET=session_secret_here
