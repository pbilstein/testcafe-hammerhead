import nativeMethods from '../native-methods';
import { isTextEditableElementAndEditingAllowed, isShadowUIElement } from '../../utils/dom';

const ELEMENT_EDITING_OBSERVED_FLAG = 'hammerhead|element-editing-observed';
const OLD_VALUE_PROPERTY            = 'hammerhead|old-value';

export default class ElementEditingWatcher {
    constructor (eventSimulator) {
        this.eventSimulator = eventSimulator;
    }

    _onBlur (e) {
        if (!this.processElementChanging(e.target))
            this.stopWatching(e.target);
    }

    _onChange (e) {
        this.stopWatching(e.target);
    }

    stopWatching (el) {
        if (el) {
            nativeMethods.removeEventListener.call(el, 'blur', e => this._onBlur(e));
            nativeMethods.removeEventListener.call(el, 'change', e => this._onChange(e));

            if (el[ELEMENT_EDITING_OBSERVED_FLAG])
                delete el[ELEMENT_EDITING_OBSERVED_FLAG];

            if (el[OLD_VALUE_PROPERTY])
                delete el[OLD_VALUE_PROPERTY];
        }
    }

    watchElementEditing (el) {
        if (el && !el[ELEMENT_EDITING_OBSERVED_FLAG] &&
            isTextEditableElementAndEditingAllowed(el) && !isShadowUIElement(el)) {

            el[ELEMENT_EDITING_OBSERVED_FLAG] = true;
            el[OLD_VALUE_PROPERTY]            = el.value;


            nativeMethods.addEventListener.call(el, 'blur', e => this._onBlur(e));
            nativeMethods.addEventListener.call(el, 'change', e => this._onChange(e));
        }
    }

    restartWatchingElementEditing (el) {
        if (el && el[ELEMENT_EDITING_OBSERVED_FLAG])
            el[OLD_VALUE_PROPERTY] = el.value;
    }

    processElementChanging (el) {
        if (el && el[ELEMENT_EDITING_OBSERVED_FLAG] && el.value !== el[OLD_VALUE_PROPERTY]) {
            this.eventSimulator.change(el);
            this.restartWatchingElementEditing(el);

            return true;
        }

        return false;
    }
}
