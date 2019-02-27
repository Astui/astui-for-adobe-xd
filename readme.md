# Astui for Adobe XD

## Installation

1. Download / clone this repo
2. Zip up the plugin folder (com.adobe.xd.astui) and rename the extension to "xdx".
3. Double click on the package and it's installed.

### Alternatively:

Find our plugin in **Plugins -> Discover -> Astui**

## Usage
Documentation for the API itself - [Astui API Documentation](http://astui.tech/docs/api/#introduction)

Each operation has been extracted into their own module.

**Smart Point Removal** - processed your selection and removes unnecessary points ensuring your artwork is still editable.

**Move Points To Tangencies** - moves points by 90°.

**Offset Paths** - allows to offset paths but offset limit and the path type, as well as keeping the original path on the screen. _More information to come_

**Outline Strokes** - creates paths out of strokes on the selection.


## Obtaining the API token

Register and log-in to [Astui](https://astui.tech/). Click on the **API** submenu. Create your token. Keep it safe. 
The last token is also available on [Astui Setting's Page](https://astui.tech/settings) when you're logged in.


## Dependencies

[XD-Storage-Helper](https://github.com/pklaschka/xd-storage-helper) is used to manage the settings file.


