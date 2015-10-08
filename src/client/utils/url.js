import * as sharedUrlUtils from '../../utils/url';
import * as originLocation from './origin-location';
import { DOCUMENT_CHARSET } from '../../const';
import { get as getSettings } from '../settings';

export const REQUEST_DESCRIPTOR_VALUES_SEPARATOR = sharedUrlUtils.REQUEST_DESCRIPTOR_VALUES_SEPARATOR;
export const IFRAME                              = sharedUrlUtils.IFRAME;
export const SCRIPT                              = sharedUrlUtils.SCRIPT;

export function getProxyUrl (url, proxyHostname, proxyPort, sessionId, resourceType, charsetAttrValue) {
    if (!isSupportedProtocol(url))
        return url;

    // NOTE: resolve relative URLs
    url = originLocation.resolveUrl(url);

    // NOTE: if we have a relative URL without slash (e.g. 'img123') resolver will keep
    // original proxy information, so we can return such URL as is. TODO: implement is proxy URL func
    var parsedAsProxy   = sharedUrlUtils.parseProxyUrl(url);
    var isValidProxyUrl = !!parsedAsProxy;

    if (isValidProxyUrl) {
        if (resourceType && parsedAsProxy.resourceType === resourceType)
            return url;

        // NOTE: we need to change proxy url resource type
        var destUrl = sharedUrlUtils.formatUrl(parsedAsProxy.originResourceInfo);

        return getProxyUrl(destUrl, proxyHostname, proxyPort, sessionId, resourceType, charsetAttrValue);
    }

    proxyHostname = proxyHostname || location.hostname;
    proxyPort     = proxyPort || location.port.toString();
    sessionId     = sessionId || getSettings().sessionId;


    var parsedUrl = sharedUrlUtils.parseUrl(url);
    var charset   = charsetAttrValue || resourceType === SCRIPT && document[DOCUMENT_CHARSET];

    // NOTE: seems like we've had a relative URL with leading slash or dots,
    // so our proxy info path part was removed by resolver and we have an origin URL,
    // but with incorrect host and protocol.
    if (parsedUrl.protocol === 'http:' && parsedUrl.hostname === proxyHostname && parsedUrl.port === proxyPort) {
        var parsedOriginLocation = originLocation.getParsed();

        parsedUrl.protocol = parsedOriginLocation.protocol;
        parsedUrl.host     = parsedOriginLocation.host;
        parsedUrl.hostname = parsedOriginLocation.hostname;
        parsedUrl.port     = parsedOriginLocation.port || '';

        url = sharedUrlUtils.formatUrl(parsedUrl);
    }

    return sharedUrlUtils.getProxyUrl(url, proxyHostname, proxyPort, sessionId, resourceType, charset);
}

export function getCrossDomainIframeProxyUrl (url) {
    return getProxyUrl(url, null, getSettings().crossDomainProxyPort, null, IFRAME);
}

export function getCrossDomainProxyUrl () {
    return location.protocol + '//' + location.hostname + ':' + getSettings().crossDomainProxyPort + '/';
}

export function resolveUrlAsOrigin (url) {
    return sharedUrlUtils.resolveUrlAsOrigin(url, getProxyUrl);
}

export function formatUrl (parsedUrl) {
    return sharedUrlUtils.formatUrl(parsedUrl);
}

export function parseProxyUrl (proxyUrl) {
    return sharedUrlUtils.parseProxyUrl(proxyUrl);
}

export function parseUrl (url) {
    return sharedUrlUtils.parseUrl(url);
}

export function convertToProxyUrl (url, resourceType, charsetAttrValue) {
    return getProxyUrl(url, null, null, null, resourceType, charsetAttrValue);
}

export function changeOriginUrlPart (proxyUrl, prop, value, resourceType) {
    var parsed = sharedUrlUtils.parseProxyUrl(proxyUrl);

    if (parsed) {
        var resolver  = originLocation.getResolver(document);
        var sessionId = parsed.sessionId;
        var proxy     = parsed.proxy;

        resolver.href  = parsed.originUrl;
        resolver[prop] = value;

        return getProxyUrl(resolver.href, proxy.hostname, proxy.port, sessionId, resourceType);
    }

    return proxyUrl;
}

export function isSubDomain (domain, subDomain) {
    return sharedUrlUtils.isSubDomain(domain, subDomain);
}

export function isSupportedProtocol (url) {
    return sharedUrlUtils.isSupportedProtocol(url);
}
