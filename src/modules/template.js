// Simple %name% variable insertion into a string. Based on https://stackoverflow.com/questions/377961/efficient-javascript-string-replacement/378001#378001
export default function(templateString, data) {
    data = data || {};

    return templateString.replace(
                /%([\w:]+)%/g, // or /{(\w*)}/g for "{this} instead of %this%"
                function(m, key) {
                    // If the key has a "translate:" prefix attempt to read from chrome.i18n.getMessage()
                    if (key.startsWith('translate:')) {
                        return chrome.i18n.getMessage(key.substring(10));
                    }

                    return data.hasOwnProperty( key ) ? data[ key ] : "";
                }
            );
}