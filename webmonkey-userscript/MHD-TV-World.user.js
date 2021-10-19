// ==UserScript==
// @name         MHD TV World
// @description  Improve site usability. Watch videos in external player.
// @version      1.0.1
// @match        *://mhdtvworld.xyz/*
// @match        *://*.mhdtvworld.xyz/*
// @icon         https://mhdtvworld.xyz/wp-content/uploads/2020/01/Trans-1.png
// @run-at       document-end
// @grant        unsafeWindow
// @homepage     https://github.com/warren-bank/crx-MHD-TV-World/tree/webmonkey-userscript/es5
// @supportURL   https://github.com/warren-bank/crx-MHD-TV-World/issues
// @downloadURL  https://github.com/warren-bank/crx-MHD-TV-World/raw/webmonkey-userscript/es5/webmonkey-userscript/MHD-TV-World.user.js
// @updateURL    https://github.com/warren-bank/crx-MHD-TV-World/raw/webmonkey-userscript/es5/webmonkey-userscript/MHD-TV-World.user.js
// @namespace    warren-bank
// @author       Warren Bank
// @copyright    Warren Bank
// ==/UserScript==

// ----------------------------------------------------------------------------- constants

var user_options = {
  "common": {
    "emulate_webmonkey":            false,
    "timeout_ms": {
      "channels_index":             0,
      "live_videostream":           0
    }
  },
  "webmonkey": {
    "post_intent_redirect_to_url":  "about:blank"
  },
  "greasemonkey": {
    "redirect_to_webcast_reloaded": true,
    "force_http":                   true,
    "force_https":                  false
  }
}

// ----------------------------------------------------------------------------- helpers

// make GET request, parse JSON response, pass data to callback
var download_url = function(url, headers, callback, isJSON) {
  var xhr = new unsafeWindow.XMLHttpRequest()
  xhr.open("GET", url, true, null, null)

  if (headers && (typeof headers === 'object')) {
    var keys = Object.keys(headers)
    var key, val
    for (var i=0; i < keys.length; i++) {
      key = keys[i]
      val = headers[key]
      xhr.setRequestHeader(key, val)
    }
  }

  xhr.onload = function(e) {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        try {
          var text_data, json_data

          text_data = xhr.responseText

          if (isJSON) {
            json_data = JSON.parse(text_data)
            callback(json_data)
          }
          else {
            callback(text_data)
          }
        }
        catch(error) {
        }
      }
    }
  }

  xhr.send()
}

// -----------------------------------------------------------------------------

var resolve_url = function(url) {
  if (!url)
    return null

  if (url.substr(0,4).toLowerCase() === 'http')
    return url

  var loc = unsafeWindow.location

  if (url.substr(0,2) === '//')
    return loc.protocol + url

  if (url.substr(0,1) === '/')
    return loc.protocol + '//' + loc.hostname + url

  return null
}

// -----------------------------------------------------------------------------

var make_element = function(elementName, innerContent, isText) {
  var el = unsafeWindow.document.createElement(elementName)

  if (innerContent) {
    if (isText)
      el.innerText = innerContent
    else
      el.innerHTML = innerContent
  }

  return el
}

// ----------------------------------------------------------------------------- URL links to tools on Webcast Reloaded website

var get_webcast_reloaded_url = function(video_url, vtt_url, referer_url, force_http, force_https) {
  force_http  = (typeof force_http  === 'boolean') ? force_http  : user_options.greasemonkey.force_http
  force_https = (typeof force_https === 'boolean') ? force_https : user_options.greasemonkey.force_https

  var encoded_video_url, encoded_vtt_url, encoded_referer_url, webcast_reloaded_base, webcast_reloaded_url

  encoded_video_url     = encodeURIComponent(encodeURIComponent(btoa(video_url)))
  encoded_vtt_url       = vtt_url ? encodeURIComponent(encodeURIComponent(btoa(vtt_url))) : null
  referer_url           = referer_url ? referer_url : unsafeWindow.location.href
  encoded_referer_url   = encodeURIComponent(encodeURIComponent(btoa(referer_url)))

  webcast_reloaded_base = {
    "https": "https://warren-bank.github.io/crx-webcast-reloaded/external_website/index.html",
    "http":  "http://webcast-reloaded.surge.sh/index.html"
  }

  webcast_reloaded_base = (force_http)
                            ? webcast_reloaded_base.http
                            : (force_https)
                               ? webcast_reloaded_base.https
                               : (video_url.toLowerCase().indexOf('http:') === 0)
                                  ? webcast_reloaded_base.http
                                  : webcast_reloaded_base.https

  webcast_reloaded_url  = webcast_reloaded_base + '#/watch/' + encoded_video_url + (encoded_vtt_url ? ('/subtitle/' + encoded_vtt_url) : '') + '/referer/' + encoded_referer_url
  return webcast_reloaded_url
}

// ----------------------------------------------------------------------------- URL redirect

var redirect_to_url = function(url) {
  if (!url) return

  if (typeof GM_loadUrl === 'function') {
    if (typeof GM_resolveUrl === 'function')
      url = GM_resolveUrl(url, unsafeWindow.location.href) || url

    GM_loadUrl(url, 'Referer', unsafeWindow.location.href)
  }
  else {
    try {
      unsafeWindow.top.location = url
    }
    catch(e) {
      unsafeWindow.window.location = url
    }
  }
}

var process_webmonkey_post_intent_redirect_to_url = function() {
  var url = null

  if (typeof user_options.webmonkey.post_intent_redirect_to_url === 'string')
    url = user_options.webmonkey.post_intent_redirect_to_url

  if (typeof user_options.webmonkey.post_intent_redirect_to_url === 'function')
    url = user_options.webmonkey.post_intent_redirect_to_url()

  if (typeof url === 'string')
    redirect_to_url(url)
}

var process_video_url = function(video_url, video_type, vtt_url, referer_url) {
  if (!referer_url)
    referer_url = unsafeWindow.location.href

  if (typeof GM_startIntent === 'function') {
    // running in Android-WebMonkey: open Intent chooser

    var args = [
      /* action = */ 'android.intent.action.VIEW',
      /* data   = */ video_url,
      /* type   = */ video_type
    ]

    // extras:
    if (vtt_url) {
      args.push('textUrl')
      args.push(vtt_url)
    }
    if (referer_url) {
      args.push('referUrl')
      args.push(referer_url)
    }

    GM_startIntent.apply(this, args)
    process_webmonkey_post_intent_redirect_to_url()
    return true
  }
  else if (user_options.greasemonkey.redirect_to_webcast_reloaded) {
    // running in standard web browser: redirect URL to top-level tool on Webcast Reloaded website

    redirect_to_url(get_webcast_reloaded_url(video_url, vtt_url, referer_url))
    return true
  }
  else {
    return false
  }
}

var process_hls_url = function(hls_url, vtt_url, referer_url) {
  process_video_url(/* video_url= */ hls_url, /* video_type= */ 'application/x-mpegurl', vtt_url, referer_url)
}

var process_dash_url = function(dash_url, vtt_url, referer_url) {
  process_video_url(/* video_url= */ dash_url, /* video_type= */ 'application/dash+xml', vtt_url, referer_url)
}

// ----------------------------------------------------------------------------- process video for current channel

var obtain_live_videostream_url_from_iframe = function(iframe_url) {
  var callback

  callback = function(text_data) {
    var regex, url

    text_data = text_data.replace(/[\r\n\t]+/g,' ')

    regex = /^.*['"]([^'"]+m3u8)['"].*$/

    if (!regex.test(text_data))
      return

    url       = text_data.replace(regex, '$1')
    url       = resolve_url(url)
    text_data = null

    process_hls_url(url, null, iframe_url)
  }

  download_url(iframe_url, null, callback, false)
}

var obtain_live_videostream_url = function() {
  var doc, channel_el, channel_data, api_url, callback

  doc        = unsafeWindow.document
  channel_el = doc.querySelector('.dooplay_player_option[data-post][data-type][data-nume]')

  if (!channel_el)
    return

  channel_data = [
    channel_el.getAttribute('data-post'),
    channel_el.getAttribute('data-type'),
    channel_el.getAttribute('data-nume')
  ]

  api_url = 'https://mhdtvworld.xyz/wp-json/dooplayer/v2/' + channel_data.join('/')

  callback = function(json_data) {
    var url, regex

    if ((typeof json_data !== 'object') || (json_data === null) || (!json_data.embed_url))
      return

    if (json_data.type === 'mp4') {
      url   = json_data.embed_url
      regex = /^.*source=([^&]+).*$/

      if (!regex.test(url))
        return

      url = url.replace(regex, '$1')
      url = decodeURIComponent(url)

      process_hls_url(url)
      return
    }

    if (json_data.type === 'iframe') {
      obtain_live_videostream_url_from_iframe(resolve_url(json_data.embed_url))
      return
    }
  }

  download_url(api_url, null, callback, true)
}

var update_live_videostream_DOM = function() {
  var doc, body, content

  doc     = unsafeWindow.document
  body    = doc.body
  content = doc.querySelector('#contenedor > #single > .content > .dooplay_player')

  if (!content)
    return

  while (body.childNodes.length)
    body.removeChild(body.childNodes[0])

  body.appendChild(content)
  body.className = ''
}

var process_live_videostream = function() {
  obtain_live_videostream_url()
  update_live_videostream_DOM()
}

// ----------------------------------------------------------------------------- display index of channels

var lazyload_images = function() {
  var imgs, img, src

  imgs = document.querySelectorAll('.poster > img.lazyload[data-src]')

  for (var i=0; i < imgs.length; i++) {
    img = imgs[i]
    src = img.getAttribute('data-src')

    if (!src)
      continue;

    img.removeAttribute('data-src')
    img.setAttribute('src', src)
    img.className = ''
  }
}

var update_channels_index_DOM = function() {
  var doc, body, content, style

  doc     = unsafeWindow.document
  body    = doc.body
  content = doc.querySelector('#contenedor .module > .content')
  style   = make_element('style', 'article {display: inline-block; margin:4px;} article > .poster > div {display:none;}', true)

  if (!content)
    return

  while (body.childNodes.length)
    body.removeChild(body.childNodes[0])

  body.appendChild(content)
  body.appendChild(style)
  body.className = ''

  lazyload_images()
}

var process_channels_index = function() {
  update_channels_index_DOM()
}

// ----------------------------------------------------------------------------- bootstrap

var init = function() {
  if (user_options.common.emulate_webmonkey && (unsafeWindow.window !== unsafeWindow.top)) return

  var pathname            = unsafeWindow.location.pathname
  var is_channels_index   = (pathname.indexOf('/channel/') === 0)
  var is_live_videostream = (pathname.indexOf('/live/')    === 0)

  if (is_channels_index) {
    if (user_options.common.timeout_ms.channels_index > 0)
      setTimeout(process_channels_index, user_options.common.timeout_ms.channels_index)
    else
      process_channels_index()
    return
  }

  if (is_live_videostream) {
    if (user_options.common.timeout_ms.live_videostream > 0)
      setTimeout(process_live_videostream, user_options.common.timeout_ms.live_videostream)
    else
      process_live_videostream()
    return
  }
}

init()

// -----------------------------------------------------------------------------
