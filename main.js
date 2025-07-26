"use strict";
class Vec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}
class Vec3 {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}
function arr_to_vec2(arr) {
    if (arr.length != 2) {
        throw new Error("array must have exactly 2 elements");
    }
    return new Vec2(arr[0], arr[1]);
}
function arr_to_vec3(arr) {
    if (arr.length != 3) {
        throw new Error("array must have exactly 3 elements");
    }
    return new Vec3(arr[0], arr[1], arr[2]);
}
function clamp01(v) {
    return Math.min(Math.max(v, 0.), 1.);
}
function view_transform(rgb) {
    return rgb.map(v => Math.round(255. * Math.pow(clamp01(v), 1. / 2.2)));
}
// source (minor tweaks): https://stackoverflow.com/a/17243070
function hsv_to_rgb(hsv) {
    let h = clamp01(hsv[0]);
    let s = clamp01(hsv[1]);
    let v = clamp01(hsv[2]);
    let r = 0, g = 0, b = 0;
    let i = Math.floor(h * 6);
    let f = h * 6 - i;
    let p = v * (1 - s);
    let q = v * (1 - f * s);
    let t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0:
            r = v, g = t, b = p;
            break;
        case 1:
            r = q, g = v, b = p;
            break;
        case 2:
            r = p, g = v, b = t;
            break;
        case 3:
            r = p, g = q, b = v;
            break;
        case 4:
            r = t, g = p, b = v;
            break;
        case 5:
            r = v, g = p, b = q;
            break;
    }
    return [r, g, b];
}
function deep_clone(v) {
    // null or primitive types
    if (v === null || typeof v !== 'object') {
        return v;
    }
    // built-in types that should be copied by constructor
    if (v instanceof Date) {
        return new Date(v.getTime());
    }
    /*if (v instanceof RegExp) {
        return new RegExp(v.source, v.flags) as T;
    }*/
    // arrays
    if (Array.isArray(v)) {
        return v.map(item => deep_clone(item));
    }
    // at this point, v is either a class instance of a plain object, so let's
    // check that.
    const proto = Object.getPrototypeOf(v);
    const is_plain = (proto === Object.prototype || proto === null);
    // class instance (non-plain objects)
    if (!is_plain) {
        const cloned_instance = Object.create(proto);
        for (const key of Object.getOwnPropertyNames(v)) {
            cloned_instance[key] = deep_clone(v[key]);
        }
        return cloned_instance;
    }
    // try structuredClone() for plain objects
    if (typeof structuredClone === 'function') {
        try {
            return structuredClone(v);
        }
        catch (_a) {
            // fallback below
        }
    }
    // fallback if structuredClone() failed
    const clone = {};
    for (const key in v) {
        if (Object.prototype.hasOwnProperty.call(v, key)) {
            clone[key] = deep_clone(v[key]);
        }
    }
    return clone;
}
function load_text_from_file() {
    return new Promise((resolve, reject) => {
        const input = document.body.appendChild(document.createElement("input"));
        input.type = "file";
        input.style.display = "none";
        input.addEventListener("change", () => {
            var _a;
            const file = (_a = input.files) === null || _a === void 0 ? void 0 : _a[0];
            if (!file) {
                cleanup();
                return reject(new Error("no file selected"));
            }
            const reader = new FileReader();
            reader.onload = () => {
                cleanup();
                if (typeof reader.result === "string") {
                    resolve(reader.result);
                }
                else {
                    reject(new Error("failed to read file as a string"));
                }
            };
            reader.onerror = () => {
                cleanup();
                reject(new Error("failed to read file"));
            };
            reader.readAsText(file);
        });
        input.click();
        function cleanup() {
            document.body.removeChild(input);
            input.remove();
        }
    });
}
function save_text_as_file(filename, content) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    // append, trigger click, clean up
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    a.remove();
    URL.revokeObjectURL(url);
}
function replace_substring(str, start, end, replacement) {
    return str.slice(0, start) + replacement + str.slice(end);
}
const valid_id_first_chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_';
const valid_id_chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_';
function is_valid_id(s) {
    if (s.length < 1) {
        return false;
    }
    if (!valid_id_first_chars.includes(s[0])) {
        return false;
    }
    for (const char of s) {
        if (!valid_id_chars.includes(char)) {
            return false;
        }
    }
    return true;
}
function ensure_valid_id(s) {
    if (!is_valid_id(s)) {
        throw new Error(`"${s}" is not a valid ID`);
    }
}
class Identifier {
    constructor(id) {
        this._id = id;
        ensure_valid_id(this._id);
    }
    get id() {
        return this._id;
    }
    set id(value) {
        this._id = value;
        ensure_valid_id(this._id);
    }
}
/// <reference path="utils.ts" />
function create_shader(gl, type, source) {
    const shader = gl.createShader(type);
    if (!shader) {
        throw new Error(`failed to create empty shader of type ${type}`);
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, WebGL2RenderingContext.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader) || "(no info)";
        throw new Error(`failed to compile shader of type ${type}: ${info}`);
    }
    return shader;
}
function create_program(gl, vertex_source, fragment_source) {
    const program = gl.createProgram();
    const vs = create_shader(gl, WebGL2RenderingContext.VERTEX_SHADER, vertex_source);
    const fs = create_shader(gl, WebGL2RenderingContext.FRAGMENT_SHADER, fragment_source);
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, WebGL2RenderingContext.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(program) || "(no info)";
        throw new Error(`failed to link graphics program: ${info}`);
    }
    return program;
}
// example dimensions: 1f (float), 3i (ivec3), basically the suffix after
// "gl.uniform".
function set_uniform(gl, program, name, value) {
    const location = gl.getUniformLocation(program, name);
    if (!location) {
        return false;
    }
    if (typeof value === "number") {
        gl.uniform1f(location, value);
    }
    else if (value instanceof Vec2) {
        gl.uniform2f(location, value.x, value.y);
    }
    else if (value instanceof Vec3) {
        gl.uniform3f(location, value.x, value.y, value.z);
    }
    else {
        throw new Error("unsupported uniform type");
    }
    return true;
}
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
        typeof define === 'function' && define.amd ? define(factory) :
            (global = global || self, global.morphdom = factory());
}(this, function () {
    'use strict';
    var DOCUMENT_FRAGMENT_NODE = 11;
    function morphAttrs(fromNode, toNode) {
        var toNodeAttrs = toNode.attributes;
        var attr;
        var attrName;
        var attrNamespaceURI;
        var attrValue;
        var fromValue;
        // document-fragments dont have attributes so lets not do anything
        if (toNode.nodeType === DOCUMENT_FRAGMENT_NODE || fromNode.nodeType === DOCUMENT_FRAGMENT_NODE) {
            return;
        }
        // update attributes on original DOM element
        for (var i = toNodeAttrs.length - 1; i >= 0; i--) {
            attr = toNodeAttrs[i];
            attrName = attr.name;
            attrNamespaceURI = attr.namespaceURI;
            attrValue = attr.value;
            if (attrNamespaceURI) {
                attrName = attr.localName || attrName;
                fromValue = fromNode.getAttributeNS(attrNamespaceURI, attrName);
                if (fromValue !== attrValue) {
                    if (attr.prefix === 'xmlns') {
                        attrName = attr.name; // It's not allowed to set an attribute with the XMLNS namespace without specifying the `xmlns` prefix
                    }
                    fromNode.setAttributeNS(attrNamespaceURI, attrName, attrValue);
                }
            }
            else {
                fromValue = fromNode.getAttribute(attrName);
                if (fromValue !== attrValue) {
                    fromNode.setAttribute(attrName, attrValue);
                }
            }
        }
        // Remove any extra attributes found on the original DOM element that
        // weren't found on the target element.
        var fromNodeAttrs = fromNode.attributes;
        for (var d = fromNodeAttrs.length - 1; d >= 0; d--) {
            attr = fromNodeAttrs[d];
            attrName = attr.name;
            attrNamespaceURI = attr.namespaceURI;
            if (attrNamespaceURI) {
                attrName = attr.localName || attrName;
                if (!toNode.hasAttributeNS(attrNamespaceURI, attrName)) {
                    fromNode.removeAttributeNS(attrNamespaceURI, attrName);
                }
            }
            else {
                if (!toNode.hasAttribute(attrName)) {
                    fromNode.removeAttribute(attrName);
                }
            }
        }
    }
    var range; // Create a range object for efficently rendering strings to elements.
    var NS_XHTML = 'http://www.w3.org/1999/xhtml';
    var doc = typeof document === 'undefined' ? undefined : document;
    var HAS_TEMPLATE_SUPPORT = !!doc && 'content' in doc.createElement('template');
    var HAS_RANGE_SUPPORT = !!doc && doc.createRange && 'createContextualFragment' in doc.createRange();
    function createFragmentFromTemplate(str) {
        var template = doc.createElement('template');
        template.innerHTML = str;
        return template.content.childNodes[0];
    }
    function createFragmentFromRange(str) {
        if (!range) {
            range = doc.createRange();
            range.selectNode(doc.body);
        }
        var fragment = range.createContextualFragment(str);
        return fragment.childNodes[0];
    }
    function createFragmentFromWrap(str) {
        var fragment = doc.createElement('body');
        fragment.innerHTML = str;
        return fragment.childNodes[0];
    }
    /**
     * This is about the same
     * var html = new DOMParser().parseFromString(str, 'text/html');
     * return html.body.firstChild;
     *
     * @method toElement
     * @param {String} str
     */
    function toElement(str) {
        str = str.trim();
        if (HAS_TEMPLATE_SUPPORT) {
            // avoid restrictions on content for things like `<tr><th>Hi</th></tr>` which
            // createContextualFragment doesn't support
            // <template> support not available in IE
            return createFragmentFromTemplate(str);
        }
        else if (HAS_RANGE_SUPPORT) {
            return createFragmentFromRange(str);
        }
        return createFragmentFromWrap(str);
    }
    /**
     * Returns true if two node's names are the same.
     *
     * NOTE: We don't bother checking `namespaceURI` because you will never find two HTML elements with the same
     *       nodeName and different namespace URIs.
     *
     * @param {Element} a
     * @param {Element} b The target element
     * @return {boolean}
     */
    function compareNodeNames(fromEl, toEl) {
        var fromNodeName = fromEl.nodeName;
        var toNodeName = toEl.nodeName;
        var fromCodeStart, toCodeStart;
        if (fromNodeName === toNodeName) {
            return true;
        }
        fromCodeStart = fromNodeName.charCodeAt(0);
        toCodeStart = toNodeName.charCodeAt(0);
        // If the target element is a virtual DOM node or SVG node then we may
        // need to normalize the tag name before comparing. Normal HTML elements that are
        // in the "http://www.w3.org/1999/xhtml"
        // are converted to upper case
        if (fromCodeStart <= 90 && toCodeStart >= 97) { // from is upper and to is lower
            return fromNodeName === toNodeName.toUpperCase();
        }
        else if (toCodeStart <= 90 && fromCodeStart >= 97) { // to is upper and from is lower
            return toNodeName === fromNodeName.toUpperCase();
        }
        else {
            return false;
        }
    }
    /**
     * Create an element, optionally with a known namespace URI.
     *
     * @param {string} name the element name, e.g. 'div' or 'svg'
     * @param {string} [namespaceURI] the element's namespace URI, i.e. the value of
     * its `xmlns` attribute or its inferred namespace.
     *
     * @return {Element}
     */
    function createElementNS(name, namespaceURI) {
        return !namespaceURI || namespaceURI === NS_XHTML ?
            doc.createElement(name) :
            doc.createElementNS(namespaceURI, name);
    }
    /**
     * Copies the children of one DOM element to another DOM element
     */
    function moveChildren(fromEl, toEl) {
        var curChild = fromEl.firstChild;
        while (curChild) {
            var nextChild = curChild.nextSibling;
            toEl.appendChild(curChild);
            curChild = nextChild;
        }
        return toEl;
    }
    function syncBooleanAttrProp(fromEl, toEl, name) {
        if (fromEl[name] !== toEl[name]) {
            fromEl[name] = toEl[name];
            if (fromEl[name]) {
                fromEl.setAttribute(name, '');
            }
            else {
                fromEl.removeAttribute(name);
            }
        }
    }
    var specialElHandlers = {
        OPTION: function (fromEl, toEl) {
            var parentNode = fromEl.parentNode;
            if (parentNode) {
                var parentName = parentNode.nodeName.toUpperCase();
                if (parentName === 'OPTGROUP') {
                    parentNode = parentNode.parentNode;
                    parentName = parentNode && parentNode.nodeName.toUpperCase();
                }
                if (parentName === 'SELECT' && !parentNode.hasAttribute('multiple')) {
                    if (fromEl.hasAttribute('selected') && !toEl.selected) {
                        // Workaround for MS Edge bug where the 'selected' attribute can only be
                        // removed if set to a non-empty value:
                        // https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/12087679/
                        fromEl.setAttribute('selected', 'selected');
                        fromEl.removeAttribute('selected');
                    }
                    // We have to reset select element's selectedIndex to -1, otherwise setting
                    // fromEl.selected using the syncBooleanAttrProp below has no effect.
                    // The correct selectedIndex will be set in the SELECT special handler below.
                    parentNode.selectedIndex = -1;
                }
            }
            syncBooleanAttrProp(fromEl, toEl, 'selected');
        },
        /**
         * The "value" attribute is special for the <input> element since it sets
         * the initial value. Changing the "value" attribute without changing the
         * "value" property will have no effect since it is only used to the set the
         * initial value.  Similar for the "checked" attribute, and "disabled".
         */
        INPUT: function (fromEl, toEl) {
            syncBooleanAttrProp(fromEl, toEl, 'checked');
            syncBooleanAttrProp(fromEl, toEl, 'disabled');
            if (fromEl.value !== toEl.value) {
                fromEl.value = toEl.value;
            }
            if (!toEl.hasAttribute('value')) {
                fromEl.removeAttribute('value');
            }
        },
        TEXTAREA: function (fromEl, toEl) {
            var newValue = toEl.value;
            if (fromEl.value !== newValue) {
                fromEl.value = newValue;
            }
            var firstChild = fromEl.firstChild;
            if (firstChild) {
                // Needed for IE. Apparently IE sets the placeholder as the
                // node value and vise versa. This ignores an empty update.
                var oldValue = firstChild.nodeValue;
                if (oldValue == newValue || (!newValue && oldValue == fromEl.placeholder)) {
                    return;
                }
                firstChild.nodeValue = newValue;
            }
        },
        SELECT: function (fromEl, toEl) {
            if (!toEl.hasAttribute('multiple')) {
                var selectedIndex = -1;
                var i = 0;
                // We have to loop through children of fromEl, not toEl since nodes can be moved
                // from toEl to fromEl directly when morphing.
                // At the time this special handler is invoked, all children have already been morphed
                // and appended to / removed from fromEl, so using fromEl here is safe and correct.
                var curChild = fromEl.firstChild;
                var optgroup;
                var nodeName;
                while (curChild) {
                    nodeName = curChild.nodeName && curChild.nodeName.toUpperCase();
                    if (nodeName === 'OPTGROUP') {
                        optgroup = curChild;
                        curChild = optgroup.firstChild;
                    }
                    else {
                        if (nodeName === 'OPTION') {
                            if (curChild.hasAttribute('selected')) {
                                selectedIndex = i;
                                break;
                            }
                            i++;
                        }
                        curChild = curChild.nextSibling;
                        if (!curChild && optgroup) {
                            curChild = optgroup.nextSibling;
                            optgroup = null;
                        }
                    }
                }
                fromEl.selectedIndex = selectedIndex;
            }
        }
    };
    var ELEMENT_NODE = 1;
    var DOCUMENT_FRAGMENT_NODE$1 = 11;
    var TEXT_NODE = 3;
    var COMMENT_NODE = 8;
    function noop() { }
    function defaultGetNodeKey(node) {
        if (node) {
            return (node.getAttribute && node.getAttribute('id')) || node.id;
        }
    }
    function morphdomFactory(morphAttrs) {
        return function morphdom(fromNode, toNode, options) {
            if (!options) {
                options = {};
            }
            if (typeof toNode === 'string') {
                if (fromNode.nodeName === '#document' || fromNode.nodeName === 'HTML' || fromNode.nodeName === 'BODY') {
                    var toNodeHtml = toNode;
                    toNode = doc.createElement('html');
                    toNode.innerHTML = toNodeHtml;
                }
                else {
                    toNode = toElement(toNode);
                }
            }
            else if (toNode.nodeType === DOCUMENT_FRAGMENT_NODE$1) {
                toNode = toNode.firstElementChild;
            }
            var getNodeKey = options.getNodeKey || defaultGetNodeKey;
            var onBeforeNodeAdded = options.onBeforeNodeAdded || noop;
            var onNodeAdded = options.onNodeAdded || noop;
            var onBeforeElUpdated = options.onBeforeElUpdated || noop;
            var onElUpdated = options.onElUpdated || noop;
            var onBeforeNodeDiscarded = options.onBeforeNodeDiscarded || noop;
            var onNodeDiscarded = options.onNodeDiscarded || noop;
            var onBeforeElChildrenUpdated = options.onBeforeElChildrenUpdated || noop;
            var skipFromChildren = options.skipFromChildren || noop;
            var addChild = options.addChild || function (parent, child) { return parent.appendChild(child); };
            var childrenOnly = options.childrenOnly === true;
            // This object is used as a lookup to quickly find all keyed elements in the original DOM tree.
            var fromNodesLookup = Object.create(null);
            var keyedRemovalList = [];
            function addKeyedRemoval(key) {
                keyedRemovalList.push(key);
            }
            function walkDiscardedChildNodes(node, skipKeyedNodes) {
                if (node.nodeType === ELEMENT_NODE) {
                    var curChild = node.firstChild;
                    while (curChild) {
                        var key = undefined;
                        if (skipKeyedNodes && (key = getNodeKey(curChild))) {
                            // If we are skipping keyed nodes then we add the key
                            // to a list so that it can be handled at the very end.
                            addKeyedRemoval(key);
                        }
                        else {
                            // Only report the node as discarded if it is not keyed. We do this because
                            // at the end we loop through all keyed elements that were unmatched
                            // and then discard them in one final pass.
                            onNodeDiscarded(curChild);
                            if (curChild.firstChild) {
                                walkDiscardedChildNodes(curChild, skipKeyedNodes);
                            }
                        }
                        curChild = curChild.nextSibling;
                    }
                }
            }
            /**
            * Removes a DOM node out of the original DOM
            *
            * @param  {Node} node The node to remove
            * @param  {Node} parentNode The nodes parent
            * @param  {Boolean} skipKeyedNodes If true then elements with keys will be skipped and not discarded.
            * @return {undefined}
            */
            function removeNode(node, parentNode, skipKeyedNodes) {
                if (onBeforeNodeDiscarded(node) === false) {
                    return;
                }
                if (parentNode) {
                    parentNode.removeChild(node);
                }
                onNodeDiscarded(node);
                walkDiscardedChildNodes(node, skipKeyedNodes);
            }
            // // TreeWalker implementation is no faster, but keeping this around in case this changes in the future
            // function indexTree(root) {
            //     var treeWalker = document.createTreeWalker(
            //         root,
            //         NodeFilter.SHOW_ELEMENT);
            //
            //     var el;
            //     while((el = treeWalker.nextNode())) {
            //         var key = getNodeKey(el);
            //         if (key) {
            //             fromNodesLookup[key] = el;
            //         }
            //     }
            // }
            // // NodeIterator implementation is no faster, but keeping this around in case this changes in the future
            //
            // function indexTree(node) {
            //     var nodeIterator = document.createNodeIterator(node, NodeFilter.SHOW_ELEMENT);
            //     var el;
            //     while((el = nodeIterator.nextNode())) {
            //         var key = getNodeKey(el);
            //         if (key) {
            //             fromNodesLookup[key] = el;
            //         }
            //     }
            // }
            function indexTree(node) {
                if (node.nodeType === ELEMENT_NODE || node.nodeType === DOCUMENT_FRAGMENT_NODE$1) {
                    var curChild = node.firstChild;
                    while (curChild) {
                        var key = getNodeKey(curChild);
                        if (key) {
                            fromNodesLookup[key] = curChild;
                        }
                        // Walk recursively
                        indexTree(curChild);
                        curChild = curChild.nextSibling;
                    }
                }
            }
            indexTree(fromNode);
            function handleNodeAdded(el) {
                onNodeAdded(el);
                var curChild = el.firstChild;
                while (curChild) {
                    var nextSibling = curChild.nextSibling;
                    var key = getNodeKey(curChild);
                    if (key) {
                        var unmatchedFromEl = fromNodesLookup[key];
                        // if we find a duplicate #id node in cache, replace `el` with cache value
                        // and morph it to the child node.
                        if (unmatchedFromEl && compareNodeNames(curChild, unmatchedFromEl)) {
                            curChild.parentNode.replaceChild(unmatchedFromEl, curChild);
                            morphEl(unmatchedFromEl, curChild);
                        }
                        else {
                            handleNodeAdded(curChild);
                        }
                    }
                    else {
                        // recursively call for curChild and it's children to see if we find something in
                        // fromNodesLookup
                        handleNodeAdded(curChild);
                    }
                    curChild = nextSibling;
                }
            }
            function cleanupFromEl(fromEl, curFromNodeChild, curFromNodeKey) {
                // We have processed all of the "to nodes". If curFromNodeChild is
                // non-null then we still have some from nodes left over that need
                // to be removed
                while (curFromNodeChild) {
                    var fromNextSibling = curFromNodeChild.nextSibling;
                    if ((curFromNodeKey = getNodeKey(curFromNodeChild))) {
                        // Since the node is keyed it might be matched up later so we defer
                        // the actual removal to later
                        addKeyedRemoval(curFromNodeKey);
                    }
                    else {
                        // NOTE: we skip nested keyed nodes from being removed since there is
                        //       still a chance they will be matched up later
                        removeNode(curFromNodeChild, fromEl, true /* skip keyed nodes */);
                    }
                    curFromNodeChild = fromNextSibling;
                }
            }
            function morphEl(fromEl, toEl, childrenOnly) {
                var toElKey = getNodeKey(toEl);
                if (toElKey) {
                    // If an element with an ID is being morphed then it will be in the final
                    // DOM so clear it out of the saved elements collection
                    delete fromNodesLookup[toElKey];
                }
                if (!childrenOnly) {
                    // optional
                    var beforeUpdateResult = onBeforeElUpdated(fromEl, toEl);
                    if (beforeUpdateResult === false) {
                        return;
                    }
                    else if (beforeUpdateResult instanceof HTMLElement) {
                        fromEl = beforeUpdateResult;
                        // reindex the new fromEl in case it's not in the same
                        // tree as the original fromEl
                        // (Phoenix LiveView sometimes returns a cloned tree,
                        //  but keyed lookups would still point to the original tree)
                        indexTree(fromEl);
                    }
                    // update attributes on original DOM element first
                    morphAttrs(fromEl, toEl);
                    // optional
                    onElUpdated(fromEl);
                    if (onBeforeElChildrenUpdated(fromEl, toEl) === false) {
                        return;
                    }
                }
                if (fromEl.nodeName !== 'TEXTAREA') {
                    morphChildren(fromEl, toEl);
                }
                else {
                    specialElHandlers.TEXTAREA(fromEl, toEl);
                }
            }
            function morphChildren(fromEl, toEl) {
                var skipFrom = skipFromChildren(fromEl, toEl);
                var curToNodeChild = toEl.firstChild;
                var curFromNodeChild = fromEl.firstChild;
                var curToNodeKey;
                var curFromNodeKey;
                var fromNextSibling;
                var toNextSibling;
                var matchingFromEl;
                // walk the children
                outer: while (curToNodeChild) {
                    toNextSibling = curToNodeChild.nextSibling;
                    curToNodeKey = getNodeKey(curToNodeChild);
                    // walk the fromNode children all the way through
                    while (!skipFrom && curFromNodeChild) {
                        fromNextSibling = curFromNodeChild.nextSibling;
                        if (curToNodeChild.isSameNode && curToNodeChild.isSameNode(curFromNodeChild)) {
                            curToNodeChild = toNextSibling;
                            curFromNodeChild = fromNextSibling;
                            continue outer;
                        }
                        curFromNodeKey = getNodeKey(curFromNodeChild);
                        var curFromNodeType = curFromNodeChild.nodeType;
                        // this means if the curFromNodeChild doesnt have a match with the curToNodeChild
                        var isCompatible = undefined;
                        if (curFromNodeType === curToNodeChild.nodeType) {
                            if (curFromNodeType === ELEMENT_NODE) {
                                // Both nodes being compared are Element nodes
                                if (curToNodeKey) {
                                    // The target node has a key so we want to match it up with the correct element
                                    // in the original DOM tree
                                    if (curToNodeKey !== curFromNodeKey) {
                                        // The current element in the original DOM tree does not have a matching key so
                                        // let's check our lookup to see if there is a matching element in the original
                                        // DOM tree
                                        if ((matchingFromEl = fromNodesLookup[curToNodeKey])) {
                                            if (fromNextSibling === matchingFromEl) {
                                                // Special case for single element removals. To avoid removing the original
                                                // DOM node out of the tree (since that can break CSS transitions, etc.),
                                                // we will instead discard the current node and wait until the next
                                                // iteration to properly match up the keyed target element with its matching
                                                // element in the original tree
                                                isCompatible = false;
                                            }
                                            else {
                                                // We found a matching keyed element somewhere in the original DOM tree.
                                                // Let's move the original DOM node into the current position and morph
                                                // it.
                                                // NOTE: We use insertBefore instead of replaceChild because we want to go through
                                                // the `removeNode()` function for the node that is being discarded so that
                                                // all lifecycle hooks are correctly invoked
                                                fromEl.insertBefore(matchingFromEl, curFromNodeChild);
                                                // fromNextSibling = curFromNodeChild.nextSibling;
                                                if (curFromNodeKey) {
                                                    // Since the node is keyed it might be matched up later so we defer
                                                    // the actual removal to later
                                                    addKeyedRemoval(curFromNodeKey);
                                                }
                                                else {
                                                    // NOTE: we skip nested keyed nodes from being removed since there is
                                                    //       still a chance they will be matched up later
                                                    removeNode(curFromNodeChild, fromEl, true /* skip keyed nodes */);
                                                }
                                                curFromNodeChild = matchingFromEl;
                                                curFromNodeKey = getNodeKey(curFromNodeChild);
                                            }
                                        }
                                        else {
                                            // The nodes are not compatible since the "to" node has a key and there
                                            // is no matching keyed node in the source tree
                                            isCompatible = false;
                                        }
                                    }
                                }
                                else if (curFromNodeKey) {
                                    // The original has a key
                                    isCompatible = false;
                                }
                                isCompatible = isCompatible !== false && compareNodeNames(curFromNodeChild, curToNodeChild);
                                if (isCompatible) {
                                    // We found compatible DOM elements so transform
                                    // the current "from" node to match the current
                                    // target DOM node.
                                    // MORPH
                                    morphEl(curFromNodeChild, curToNodeChild);
                                }
                            }
                            else if (curFromNodeType === TEXT_NODE || curFromNodeType == COMMENT_NODE) {
                                // Both nodes being compared are Text or Comment nodes
                                isCompatible = true;
                                // Simply update nodeValue on the original node to
                                // change the text value
                                if (curFromNodeChild.nodeValue !== curToNodeChild.nodeValue) {
                                    curFromNodeChild.nodeValue = curToNodeChild.nodeValue;
                                }
                            }
                        }
                        if (isCompatible) {
                            // Advance both the "to" child and the "from" child since we found a match
                            // Nothing else to do as we already recursively called morphChildren above
                            curToNodeChild = toNextSibling;
                            curFromNodeChild = fromNextSibling;
                            continue outer;
                        }
                        // No compatible match so remove the old node from the DOM and continue trying to find a
                        // match in the original DOM. However, we only do this if the from node is not keyed
                        // since it is possible that a keyed node might match up with a node somewhere else in the
                        // target tree and we don't want to discard it just yet since it still might find a
                        // home in the final DOM tree. After everything is done we will remove any keyed nodes
                        // that didn't find a home
                        if (curFromNodeKey) {
                            // Since the node is keyed it might be matched up later so we defer
                            // the actual removal to later
                            addKeyedRemoval(curFromNodeKey);
                        }
                        else {
                            // NOTE: we skip nested keyed nodes from being removed since there is
                            //       still a chance they will be matched up later
                            removeNode(curFromNodeChild, fromEl, true /* skip keyed nodes */);
                        }
                        curFromNodeChild = fromNextSibling;
                    } // END: while(curFromNodeChild) {}
                    // If we got this far then we did not find a candidate match for
                    // our "to node" and we exhausted all of the children "from"
                    // nodes. Therefore, we will just append the current "to" node
                    // to the end
                    if (curToNodeKey && (matchingFromEl = fromNodesLookup[curToNodeKey]) && compareNodeNames(matchingFromEl, curToNodeChild)) {
                        // MORPH
                        if (!skipFrom) {
                            addChild(fromEl, matchingFromEl);
                        }
                        morphEl(matchingFromEl, curToNodeChild);
                    }
                    else {
                        var onBeforeNodeAddedResult = onBeforeNodeAdded(curToNodeChild);
                        if (onBeforeNodeAddedResult !== false) {
                            if (onBeforeNodeAddedResult) {
                                curToNodeChild = onBeforeNodeAddedResult;
                            }
                            if (curToNodeChild.actualize) {
                                curToNodeChild = curToNodeChild.actualize(fromEl.ownerDocument || doc);
                            }
                            addChild(fromEl, curToNodeChild);
                            handleNodeAdded(curToNodeChild);
                        }
                    }
                    curToNodeChild = toNextSibling;
                    curFromNodeChild = fromNextSibling;
                }
                cleanupFromEl(fromEl, curFromNodeChild, curFromNodeKey);
                var specialElHandler = specialElHandlers[fromEl.nodeName];
                if (specialElHandler) {
                    specialElHandler(fromEl, toEl);
                }
            } // END: morphChildren(...)
            var morphedNode = fromNode;
            var morphedNodeType = morphedNode.nodeType;
            var toNodeType = toNode.nodeType;
            if (!childrenOnly) {
                // Handle the case where we are given two DOM nodes that are not
                // compatible (e.g. <div> --> <span> or <div> --> TEXT)
                if (morphedNodeType === ELEMENT_NODE) {
                    if (toNodeType === ELEMENT_NODE) {
                        if (!compareNodeNames(fromNode, toNode)) {
                            onNodeDiscarded(fromNode);
                            morphedNode = moveChildren(fromNode, createElementNS(toNode.nodeName, toNode.namespaceURI));
                        }
                    }
                    else {
                        // Going from an element node to a text node
                        morphedNode = toNode;
                    }
                }
                else if (morphedNodeType === TEXT_NODE || morphedNodeType === COMMENT_NODE) { // Text or comment node
                    if (toNodeType === morphedNodeType) {
                        if (morphedNode.nodeValue !== toNode.nodeValue) {
                            morphedNode.nodeValue = toNode.nodeValue;
                        }
                        return morphedNode;
                    }
                    else {
                        // Text node to something else
                        morphedNode = toNode;
                    }
                }
            }
            if (morphedNode === toNode) {
                // The "to node" was not compatible with the "from node" so we had to
                // toss out the "from node" and use the "to node"
                onNodeDiscarded(fromNode);
            }
            else {
                if (toNode.isSameNode && toNode.isSameNode(morphedNode)) {
                    return;
                }
                morphEl(morphedNode, toNode, childrenOnly);
                // We now need to loop over any keyed nodes that might need to be
                // removed. We only do the removal if we know that the keyed node
                // never found a match. When a keyed node is matched up we remove
                // it out of fromNodesLookup and we use fromNodesLookup to determine
                // if a keyed node has been matched up or not
                if (keyedRemovalList) {
                    for (var i = 0, len = keyedRemovalList.length; i < len; i++) {
                        var elToRemove = fromNodesLookup[keyedRemovalList[i]];
                        if (elToRemove) {
                            removeNode(elToRemove, elToRemove.parentNode, false);
                        }
                    }
                }
            }
            if (!childrenOnly && morphedNode !== fromNode && fromNode.parentNode) {
                if (morphedNode.actualize) {
                    morphedNode = morphedNode.actualize(fromNode.ownerDocument || doc);
                }
                // If we had to swap out the from node with a new node because the old
                // node was not compatible with the target node then we need to
                // replace the old DOM node in the original DOM tree. This is only
                // possible if the original DOM node was part of a DOM tree which
                // we know is the case if it has a parent node.
                fromNode.parentNode.replaceChild(morphedNode, fromNode);
            }
            return morphedNode;
        };
    }
    var morphdom = morphdomFactory(morphAttrs);
    return morphdom;
}));
/// <reference path="utils.ts" />
/// <reference path="../morphdom/morphdom-umd.js" />
class Language {
    constructor(id, name, rtl) {
        this.id = id;
        this.name = name;
        this.rtl = rtl;
    }
}
class LanguageBank {
    constructor(languages = []) {
        this.languages = languages;
    }
    add(language) {
        this.languages.push(language);
    }
    get(language_id) {
        for (const lang of this.languages) {
            if (lang.id.id === language_id) {
                return lang;
            }
        }
        return null;
    }
}
const lang_bank = new LanguageBank([
    new Language(new Identifier("en"), "English", false),
    new Language(new Identifier("fa"), "فارسی", true)
]);
;
class TextBank {
    constructor(current_language, data = {}) {
        this.current_language = current_language;
        this.data = data;
        for (const key in this.data) {
            ensure_valid_id(key);
        }
    }
    get(text_id) {
        if (text_id === "-current-language") {
            return this.current_language.name;
        }
        if (text_id === "-current-language-id") {
            return this.current_language.id.id;
        }
        try {
            if (!this.data[text_id]) {
                throw new Error("non-existent text_id");
            }
            if (!this.data[text_id][this.current_language.id.id]) {
                throw new Error("no translation for the current language");
            }
            return this.data[text_id][this.current_language.id.id];
        }
        catch (error) {
            console.error(error);
            if (this.current_language.id.id == "fa") {
                return "(خطا در تحلیل متن)";
            }
            else {
                return "(text resolution error)";
            }
        }
    }
    // replace every instance of @@text-id with the resolved value based on the
    // current language.
    resolve(text) {
        for (let i = 0; i < text.length - 3;) {
            // find a '@@'
            if (text[i] !== '@' || text[i + 1] !== '@') {
                i++;
                continue;
            }
            // skip the '@@'
            let start_idx = i;
            i += 2;
            // read the following ID
            let text_id = "";
            if (valid_id_first_chars.includes(text[i])) {
                text_id = text[i];
                i++;
                while (i < text.length && valid_id_chars.includes(text[i])) {
                    text_id += text[i];
                    i++;
                }
            }
            let end_idx = i;
            // skip if it's invalid or empty
            if (!is_valid_id(text_id)) {
                continue;
            }
            // replace with the resolved value
            let resolved = this.get(text_id);
            text = replace_substring(text, start_idx, end_idx, resolved);
            // adjust the index because the resolved value might have a
            // different length.
            i += resolved.length - (end_idx - start_idx);
        }
        return text;
    }
    apply_to(elem = document.documentElement) {
        morphdom(elem, this.resolve(elem.outerHTML));
    }
}
const text_bank = new TextBank(lang_bank.get("fa"), {
    "title": {
        "en": "Prayer Pattern Generator",
        "fa": "الگوی صف نماز جماعت"
    },
    "tile": {
        "en": "Tile",
        "fa": "کادر"
    },
    "dimensions": {
        "en": "Dimensions",
        "fa": "ابعاد"
    },
    "thickness": {
        "en": "Thickness",
        "fa": "ضخامت"
    },
    "grid-lines": {
        "en": "Grid Lines",
        "fa": "خطوط کمکی"
    },
    "density": {
        "en": "Density",
        "fa": "تراکم"
    },
    "horizontal-lines": {
        "en": "Horizontal Lines",
        "fa": "خطوط افقی"
    },
    "vertical-lines": {
        "en": "Vertical Lines",
        "fa": "خطوط عمودی"
    },
    "masjad": {
        "en": "Masjad",
        "fa": "سجده‌گاه"
    },
    "position": {
        "en": "Position",
        "fa": "موقعیت"
    },
    "radius": {
        "en": "Radius",
        "fa": "شعاع"
    },
    "feet": {
        "en": "Feet",
        "fa": "پا‌ها"
    },
    "distance": {
        "en": "Distance",
        "fa": "فاصله"
    },
    "opacity": {
        "en": "Opacity",
        "fa": "شفافیت" //it's the opposite but it's cleaner
    },
    "transform": {
        "en": "Transform",
        "fa": "تبدیل خطی"
    },
    "scale": {
        "en": "Scale",
        "fa": "مقیاس"
    },
    "skew": {
        "en": "Skew",
        "fa": "کجی"
    },
    "rotation": {
        "en": "Rotation",
        "fa": "چرخش"
    },
    "offset": {
        "en": "Offset",
        "fa": "انحراف"
    },
    "bg-color": {
        "en": "Background Color",
        "fa": "رنگ پس‌زمینه"
    },
    "pattern-color": {
        "en": "Pattern Color",
        "fa": "رنگ الگو"
    },
    "hue": {
        "en": "Hue",
        "fa": "رنگ"
    },
    "saturation": {
        "en": "Saturation",
        "fa": "اشباع"
    },
    "value": {
        "en": "Value",
        "fa": "مقدار"
    },
    "hide": {
        "en": "Hide",
        "fa": "پنهان کن"
    },
    "import": {
        "en": "Import",
        "fa": "وارد کن"
    },
    "export": {
        "en": "Export",
        "fa": "صادر کن"
    },
    "reset-all": {
        "en": "Reset All",
        "fa": "ریست کن"
    },
    "webgl2-not-supported": {
        "en": "WebGL2 is not supported.",
        "fa": "مرورگر یا دستگاه شما از WebGL2 پشتیبانی نمی‌کند."
    },
    "px": {
        "en": "px",
        "fa": "پیکسل"
    }
});
function slider_create(min, max, step, value) {
    let slider_wrapper = document.createElement("div");
    slider_wrapper.className = "control slider-wrapper";
    let input = slider_wrapper.appendChild(document.createElement("input"));
    input.className = "slider-input";
    input.type = "range";
    input.min = min.toString();
    input.max = max.toString();
    input.step = step.toString();
    input.value = value.toString();
    let indicator = slider_wrapper.appendChild(document.createElement("div"));
    indicator.className = "slider-indicator";
    let show_indicator = () => indicator.classList.add("slider-indicator-show");
    let hide_indicator = () => indicator.classList.remove("slider-indicator-show");
    input.addEventListener("mouseenter", show_indicator);
    input.addEventListener("pointerenter", show_indicator);
    input.addEventListener("mousedown", show_indicator);
    input.addEventListener("pointerdown", show_indicator);
    input.addEventListener("mouseup", hide_indicator);
    input.addEventListener("pointerup", hide_indicator);
    input.addEventListener("mouseleave", hide_indicator);
    input.addEventListener("pointerleave", hide_indicator);
    return slider_wrapper;
}
function slider_get_input(elem) {
    return elem.getElementsByTagName("input")[0];
}
function slider_get_indicator(elem) {
    return elem.getElementsByTagName("div")[0];
}
/// <reference path="utils.ts" />
/// <reference path="ui.ts" />
function get_value_type(v) {
    if (typeof v === "number") {
        return "number";
    }
    else if (v instanceof Vec2) {
        return "Vec2";
    }
    else {
        throw new Error("unsupported value type");
    }
}
class Param {
    constructor(id, name, value, element = null, change_event = null, render_event = null, config = {}) {
        this._id = id;
        this._name = name;
        this._value = deep_clone(value);
        if (element === "use-id") {
            this._element = document.getElementById(this._id);
        }
        else {
            this._element = element;
        }
        this._change_event = change_event;
        this._render_event = render_event;
        this._config = deep_clone(config);
        this.render();
    }
    id() {
        return this._id;
    }
    name() {
        return this._name;
    }
    set_name(new_name) {
        this._name = new_name;
        this.render_from_scratch();
    }
    element() {
        return this._element;
    }
    set_element(new_element) {
        this._element = new_element;
    }
    change_event() {
        return this._change_event;
    }
    set_change_event(new_event) {
        this._change_event = new_event;
    }
    render_event() {
        return this._render_event;
    }
    set_render_event(new_event) {
        this._render_event = new_event;
    }
    config() {
        return this._config;
    }
    set_config(new_config) {
        this._config = deep_clone(new_config);
    }
    get() {
        return this._value;
    }
    set(new_value, invoke_change_event = false) {
        if (typeof new_value !== typeof this._value) {
            throw new Error("can't change parameter's value type after it's been " +
                "constructed.");
        }
        const old_value = deep_clone(this._value);
        this._value = deep_clone(new_value);
        if (invoke_change_event && this._change_event !== null) {
            this._change_event(this, old_value, this._value, true);
        }
        this.render();
    }
    number_to_str(v) {
        let s_value;
        if (typeof this._config.decimal_digits === "number") {
            s_value = v.toFixed(this._config.decimal_digits);
        }
        else {
            s_value = v.toString();
        }
        let unit_str = "";
        if (typeof (this._config.value_unit) === "string") {
            unit_str = " " + text_bank.resolve(this._config.value_unit);
        }
        return s_value + unit_str;
    }
    render_from_scratch() {
        if (this._element === null) {
            return;
        }
        let elem = document.createElement("div");
        elem.id = this._element.id;
        elem.toggleAttribute("has-ever-rendered", true);
        elem.className = "control-container";
        let label = elem.appendChild(document.createElement("div"));
        label.className = "control-label";
        label.textContent = text_bank.resolve(this._name);
        if (typeof this._value === "number") {
            let slider = elem.appendChild(slider_create((this._config.min || 0.), (this._config.max || 1.), (this._config.step || .001), this._value));
            let indicator = slider_get_indicator(slider);
            indicator.innerHTML = this.number_to_str(this._value);
            let input = slider_get_input(slider);
            input.addEventListener("input", () => {
                const old_value = deep_clone(this._value);
                this._value = parseFloat(input.value);
                indicator.innerHTML = this.number_to_str(this._value);
                if (this._change_event !== null) {
                    this._change_event(this, old_value, this._value, false);
                }
            });
        }
        else if (this._value instanceof Vec2) {
            // x
            {
                let slider = elem.appendChild(slider_create((this._config.min || 0.), (this._config.max || 1.), (this._config.step || .001), this._value.x));
                slider.style.marginInlineEnd = "0.1rem";
                let indicator = slider_get_indicator(slider);
                indicator.innerHTML = this.number_to_str(this._value.x);
                let input = slider_get_input(slider);
                input.addEventListener("input", () => {
                    if (!(this._value instanceof Vec2)) {
                        throw new Error("value type has changed!");
                    }
                    const old_value = deep_clone(this._value);
                    this._value.x = parseFloat(input.value);
                    indicator.innerHTML = this.number_to_str(this._value.x);
                    if (this._change_event !== null) {
                        this._change_event(this, old_value, this._value, false);
                    }
                });
            }
            // y
            {
                let slider = elem.appendChild(slider_create((this._config.min || 0.), (this._config.max || 1.), (this._config.step || .001), this._value.y));
                slider.style.marginInlineStart = "0.1rem";
                let indicator = slider_get_indicator(slider);
                indicator.innerHTML = this.number_to_str(this._value.y);
                let input = slider_get_input(slider);
                input.addEventListener("input", () => {
                    if (!(this._value instanceof Vec2)) {
                        throw new Error("value type has changed!");
                    }
                    const old_value = deep_clone(this._value);
                    this._value.y = parseFloat(input.value);
                    indicator.innerHTML = this.number_to_str(this._value.y);
                    if (this._change_event !== null) {
                        this._change_event(this, old_value, this._value, false);
                    }
                });
            }
        }
        else {
            throw new Error("unsupported value type");
        }
        this._element.replaceWith(elem);
        this._element = elem;
        if (this._render_event !== null) {
            this._render_event(this);
        }
    }
    render() {
        if (this._element === null) {
            return;
        }
        if (!this._element.hasAttribute("has-ever-rendered")) {
            this.render_from_scratch();
            return;
        }
        if (typeof this._value === "number") {
            let slider = this._element.getElementsByClassName("slider-wrapper")[0];
            slider_get_input(slider).value = this._value.toString();
            slider_get_indicator(slider).innerHTML =
                this.number_to_str(this._value);
        }
        else if (this._value instanceof Vec2) {
            let slider_x = this._element.getElementsByClassName("slider-wrapper")[0];
            let slider_y = this._element.getElementsByClassName("slider-wrapper")[1];
            slider_get_input(slider_x).value = this._value.x.toString();
            slider_get_input(slider_y).value = this._value.y.toString();
            slider_get_indicator(slider_x).innerHTML =
                this.number_to_str(this._value.x);
            slider_get_indicator(slider_y).innerHTML =
                this.number_to_str(this._value.y);
        }
        else {
            throw new Error("unsupported value type");
        }
        if (this._render_event !== null) {
            this._render_event(this);
        }
    }
}
class ParamList {
    constructor() {
        this.params = [];
    }
    add(new_param) {
        for (const param of this.params) {
            if (param.id() === new_param.id()) {
                throw new Error("another parameter with the same ID is already in the list");
            }
        }
        this.params.push(new_param);
        new_param.render();
    }
    get(id) {
        for (const param of this.params) {
            if (param.id() === id) {
                return param;
            }
        }
        return null;
    }
    render_all(from_scratch = false) {
        if (from_scratch) {
            for (const param of this.params) {
                param.render_from_scratch();
            }
        }
        else {
            for (const param of this.params) {
                param.render();
            }
        }
    }
    serialize() {
        let data = {};
        for (const param of this.params) {
            data[param.id()] = {
                type: get_value_type(param.get()),
                value: param.get()
            };
        }
        return JSON.stringify(data);
    }
    deserialize(s_data, invoke_change_event = false) {
        let data = JSON.parse(s_data);
        for (const key in data) {
            if (!data.hasOwnProperty(key)) {
                continue;
            }
            let param = this.get(key);
            if (param === null) {
                console.warn("data contains a parameter ID that doesn't currently exist");
                continue;
            }
            let elem = data[key];
            if (get_value_type(param.get()) !== elem.type) {
                throw new Error("data has a different value type");
            }
            if (typeof param.get() === "number") {
                param.set(elem.value, invoke_change_event);
            }
            else if (param.get() instanceof Vec2) {
                param.set(new Vec2(elem.value.x, elem.value.y));
            }
            else {
                throw new Error("unsupported value type");
            }
        }
    }
}
/// <reference path="utils.ts" />
/// <reference path="params.ts" />
/// <reference path="gl.ts" />
/// <reference path="lang.ts" />
var state = {
    canvas_ready: false,
    canvas: null,
    gl: null,
    program: null,
    vbo: null
};
var param_list = new ParamList();
var default_params = []; // backup of the initial values
function reset_params() {
    for (const param of default_params) {
        param_list.get(param.id()).set(param.get());
    }
    render_canvas();
}
function set_lang(language) {
    // update the lang attribute in the <html> tag
    document.documentElement.lang = language.id.id;
    // set the CSS property "direction"
    if (language.rtl) {
        document.body.classList.remove("ltr");
        document.body.classList.add("rtl");
    }
    else {
        document.body.classList.remove("rtl");
        document.body.classList.add("ltr");
    }
    // resolve all text in the entire DOM
    text_bank.current_language = language;
    text_bank.apply_to();
    // re-render the parameter controls from scratch
    param_list.render_all(true);
}
function init() {
    // resolve multilingual texts
    set_lang(lang_bank.get("fa"));
    // events
    document.getElementById("btn-hide").addEventListener("click", () => {
        document.getElementById("controls").classList.add("hide");
        document.getElementById("canvas").classList.remove("untouchable", "negative-z");
    });
    document.getElementById("canvas").addEventListener("click", () => {
        document.getElementById("controls").classList.remove("hide");
        document.getElementById("canvas").classList.add("untouchable", "negative-z");
    });
    document.getElementById("btn-reset-all").addEventListener("click", () => {
        reset_params();
    });
    document.getElementById("btn-import").addEventListener("click", () => {
        import_params();
    });
    document.getElementById("btn-export").addEventListener("click", () => {
        export_params();
    });
    document.getElementById("btn-change-lang").addEventListener("click", () => {
        if (lang_bank.languages.length < 1) {
            throw new Error("there are no languages in the language bank!");
        }
        let curr_lang_idx = 0;
        for (let i = 0; i < lang_bank.languages.length; i++) {
            if (lang_bank.languages[i].id.id === text_bank.current_language.id.id) {
                curr_lang_idx = i;
            }
        }
        let new_lang_idx = (curr_lang_idx + 1) % lang_bank.languages.length;
        set_lang(lang_bank.languages[new_lang_idx]);
    });
    // add parameters
    param_list.add(new Param("tile_size", "@@dimensions", new Vec2(200., 400.), "use-id", () => render_canvas(), null, { min: 10., max: 1000., step: 1., value_unit: "@@px", decimal_digits: 0 }));
    param_list.add(new Param("border_thickness", "@@thickness", 3., "use-id", () => render_canvas(), null, { min: 0., max: 20., step: .25, value_unit: "@@px", decimal_digits: 2 }));
    param_list.add(new Param("grid_lines_density", "@@density", 400., "use-id", () => render_canvas(), null, { min: 1., max: 2000., step: 1., decimal_digits: 0 }));
    param_list.add(new Param("grid_lines_thickness", "@@thickness", 1., "use-id", () => render_canvas(), null, { min: 0., max: 20., step: .25, value_unit: "@@px", decimal_digits: 2 }));
    param_list.add(new Param("grid_lines_opacity_horizontal", "@@horizontal-lines", 0., "use-id", () => render_canvas(), null, { min: 0., max: 1., step: .001, decimal_digits: 2 }));
    param_list.add(new Param("grid_lines_opacity_vertical", "@@vertical-lines", .05, "use-id", () => render_canvas(), null, { min: 0., max: 1., step: .001, decimal_digits: 2 }));
    param_list.add(new Param("masjad_position", "@@position", .125, "use-id", () => render_canvas(), null, { min: 0., max: .5, step: .001, decimal_digits: 2 }));
    param_list.add(new Param("masjad_radius", "@@radius", .05, "use-id", () => render_canvas(), null, { min: 0., max: .5, step: .001, decimal_digits: 2 }));
    param_list.add(new Param("feet_vertical_position", "@@position", .2, "use-id", () => render_canvas(), null, { min: 0., max: .5, step: .001, decimal_digits: 2 }));
    param_list.add(new Param("feet_horizontal_distance", "@@distance", .12, "use-id", () => render_canvas(), null, { min: 0., max: .3, step: .001, decimal_digits: 2 }));
    param_list.add(new Param("feet_thickness", "@@thickness", 1., "use-id", () => render_canvas(), null, { min: 0., max: 20., step: .25, value_unit: "@@px", decimal_digits: 2 }));
    param_list.add(new Param("feet_opacity", "@@opacity", 1., "use-id", () => render_canvas(), null, { min: 0., max: 1., step: .001, decimal_digits: 2 }));
    param_list.add(new Param("feet_size", "@@dimensions", new Vec2(.05, .13), "use-id", () => render_canvas(), null, { min: 0., max: .3, step: .001, decimal_digits: 2 }));
    param_list.add(new Param("transform_scale", "@@scale", new Vec2(1., 1.), "use-id", () => render_canvas(), null, { min: .1, max: 3., step: .001, decimal_digits: 3 }));
    param_list.add(new Param("transform_skew", "@@skew", new Vec2(0., 0.), "use-id", () => render_canvas(), null, { min: -1., max: 1., step: .001, decimal_digits: 3 }));
    param_list.add(new Param("transform_rotation", "@@rotation", 0., "use-id", () => render_canvas(), null, { min: -180., max: 180., step: .001, decimal_digits: 2 }));
    param_list.add(new Param("transform_offset", "@@offset", new Vec2(0., 0.), "use-id", () => render_canvas(), null, { min: -200., max: 200., step: .25, value_unit: "@@px", decimal_digits: 2 }));
    param_list.add(new Param("background_color_h", "@@hue", 0., "use-id", () => { update_color_blobs(); render_canvas(); }, () => update_color_blobs(), { min: 0., max: 1., step: .001, decimal_digits: 2 }));
    param_list.add(new Param("background_color_s", "@@saturation", 0., "use-id", () => { update_color_blobs(); render_canvas(); }, () => update_color_blobs(), { min: 0., max: 1., step: .001, decimal_digits: 2 }));
    param_list.add(new Param("background_color_v", "@@value", 0., "use-id", () => { update_color_blobs(); render_canvas(); }, () => update_color_blobs(), { min: 0., max: 1., step: .001, decimal_digits: 2 }));
    param_list.add(new Param("pattern_color_h", "@@hue", 0., "use-id", () => { update_color_blobs(); render_canvas(); }, () => update_color_blobs(), { min: 0., max: 1., step: .001, decimal_digits: 2 }));
    param_list.add(new Param("pattern_color_s", "@@saturation", 0., "use-id", () => { update_color_blobs(); render_canvas(); }, () => update_color_blobs(), { min: 0., max: 1., step: .001, decimal_digits: 2 }));
    param_list.add(new Param("pattern_color_v", "@@value", 1., "use-id", () => { update_color_blobs(); render_canvas(); }, () => update_color_blobs(), { min: 0., max: 1., step: .001, decimal_digits: 2 }));
    // make a copy of the initial values to use in reset_params()
    default_params = deep_clone(param_list.params);
    // render
    init_canvas();
    render_canvas();
}
function viewport_resized() {
    init_canvas();
    render_canvas();
}
function update_color_blobs() {
    var _a, _b, _c, _d, _e, _f;
    let background_color = view_transform(hsv_to_rgb([
        (((_a = param_list.get("background_color_h")) === null || _a === void 0 ? void 0 : _a.get()) || 0.),
        (((_b = param_list.get("background_color_s")) === null || _b === void 0 ? void 0 : _b.get()) || 0.),
        (((_c = param_list.get("background_color_v")) === null || _c === void 0 ? void 0 : _c.get()) || 0.)
    ]));
    let pattern_color = view_transform(hsv_to_rgb([
        (((_d = param_list.get("pattern_color_h")) === null || _d === void 0 ? void 0 : _d.get()) || 0.),
        (((_e = param_list.get("pattern_color_s")) === null || _e === void 0 ? void 0 : _e.get()) || 0.),
        (((_f = param_list.get("pattern_color_v")) === null || _f === void 0 ? void 0 : _f.get()) || 0.)
    ]));
    document.getElementById("background_color_blob").style.backgroundColor =
        `rgb(${background_color.join(", ")})`;
    document.getElementById("pattern_color_blob").style.backgroundColor =
        `rgb(${pattern_color.join(", ")})`;
}
function init_canvas() {
    state.canvas_ready = false;
    // try to get WebGL2 context
    state.canvas = document.getElementById("canvas");
    state.gl = state.canvas.getContext("webgl2");
    if (state.gl) {
        document.getElementById("error-message").classList.add("vanish");
    }
    else {
        console.error("failed to get WebGL2 rendering context");
        document.getElementById("error-message").classList.remove("vanish");
        document.getElementById("controls").classList.add("vanish");
        return;
    }
    // viewport resolution
    const dpr = window.devicePixelRatio || 1;
    state.canvas.width = Math.floor(window.innerWidth * dpr);
    state.canvas.height = Math.floor(window.innerHeight * dpr);
    state.gl.viewport(0, 0, state.canvas.width, state.canvas.height);
    // high DPI nonsense
    state.canvas.style.width = `${Math.floor(state.canvas.width / dpr)}px`;
    state.canvas.style.height = `${Math.floor(state.canvas.height / dpr)}px`;
    // vertex shader
    const vertex_source = `#version 300 es
in vec2 a_position;
out vec2 v_uv;

void main() {
    v_uv = (a_position + 1.) * .5;
    gl_Position = vec4(a_position, 0., 1.);
}
`;
    // fragment shader
    const fragment_source = `#version 300 es

precision highp float;
precision highp int;

in vec2 v_uv;
out vec4 out_color;

// render resolution
uniform vec2 res;

// tile
uniform vec2 tile_size; // px
uniform float border_thickness; // px

// grid lines
uniform float grid_lines_density;
uniform float grid_lines_thickness; // px
uniform float grid_lines_opacity_horizontal;
uniform float grid_lines_opacity_vertical;

// masjad
uniform float masjad_position; // 0 = top, 1 = bottom
uniform float masjad_radius; // relative to tile size

// feet
uniform float feet_vertical_position; // 0 = bottom, 1 = top
uniform float feet_horizontal_distance; // relative to tile size
uniform vec2 feet_size; // relative to tile size
uniform float feet_thickness; // px
uniform float feet_opacity;

// transform
uniform vec2 transform_scale;
uniform vec2 transform_skew;
uniform float transform_rotation; // degrees
uniform vec2 transform_offset; // px

// colors
uniform vec3 background_color;
uniform vec3 pattern_color;

/*__________ hash function collection _________*/
// sources: https://nullprogram.com/blog/2018/07/31/
//          https://www.shadertoy.com/view/WttXWX

uint triple32(uint x)
{
    x ^= x >> 17;
    x *= 0xed5ad4bbU;
    x ^= x >> 11;
    x *= 0xac4c1b51U;
    x ^= x >> 15;
    x *= 0x31848babU;
    x ^= x >> 14;
    return x;
}

// uint -> uint

uint hash(uint v)
{
    return triple32(v);
}

uint hash(uvec2 v)
{
    return triple32(v.x + triple32(v.y));
}

uint hash(uvec3 v)
{
    return triple32(v.x + triple32(v.y + triple32(v.z)));
}

uint hash(uvec4 v)
{
    return triple32(v.x + triple32(v.y + triple32(v.z + triple32(v.w))));
}

// int -> uint

uint hash(int v)
{
    return triple32(uint(v));
}

uint hash(ivec2 v)
{
    return triple32(uint(v.x) + triple32(uint(v.y)));
}

uint hash(ivec3 v)
{
    return triple32(uint(v.x) + triple32(uint(v.y) + triple32(uint(v.z))));
}

uint hash(ivec4 v)
{
    return triple32(uint(v.x) + triple32(uint(v.y) + triple32(uint(v.z) + triple32(uint(v.w)))));
}

// float -> uint

uint hash(float v)
{
    return triple32(floatBitsToUint(v));
}

uint hash(vec2 v)
{
    return triple32(floatBitsToUint(v.x) + triple32(floatBitsToUint(v.y)));
}

uint hash(vec3 v)
{
    return triple32(floatBitsToUint(v.x) + triple32(floatBitsToUint(v.y) + triple32(floatBitsToUint(v.z))));
}

uint hash(vec4 v)
{
    return triple32(floatBitsToUint(v.x) + triple32(floatBitsToUint(v.y) + triple32(floatBitsToUint(v.z) + triple32(floatBitsToUint(v.w)))));
}

// any -> int
#define hashi(v) int(hash(v))

// any -> float
#define hashf(v) (float(hash(v)) / 4294967295.)

/*____________________ end ____________________*/

#define inv_step(a, b) (step(b, a))

mat2 rotate_2d(float angle)
{
    float s = sin(angle);
    float c = cos(angle);
    return mat2(
        c, s,
        -s, c
    );
}

// ellipse signed distance
// source (minor tweaks): https://www.shadertoy.com/view/4sS3zz
float msign(in float x) { return (x<0.0)?-1.0:1.0; }
float sd_ellipse(vec2 p, vec2 ab)
{
  //if( ab.x==ab.y ) return length(p)-ab.x;

    float aspect_ratio = ab.y / ab.x;
    if (abs(aspect_ratio - 1.) < .001)
    {
        return length(p) - ab.x;
    }

	p = abs( p ); 
    if( p.x>p.y ){ p=p.yx; ab=ab.yx; }
	
	float l = ab.y*ab.y - ab.x*ab.x;
    float m = ab.x*p.x/l; float m2 = m*m;
	float n = ab.y*p.y/l; float n2 = n*n;
    float c = (m2+n2-1.0)/3.0; float c2 = c*c; float c3 = c*c2;
    float d = c3 + m2*n2;
    float q = d  + m2*n2;
    float g = m  + m *n2;

    float co;

    if( d<0.0 )
    {
        float h = acos(q/c3)/3.0;
        float s = cos(h); s += 2.0;
        float t = sin(h); t *= sqrt(3.0);
        float rx = sqrt( m2-c*(s+t) );
        float ry = sqrt( m2-c*(s-t) );
        co = ry + sign(l)*rx + abs(g)/(rx*ry);
    }
    else                                    // d>0
    {                                       // q>0
        float h = 2.0*m*n*sqrt(d);          // h>0
        float s = pow(q+h, 1.0/3.0 );       // s>0
        float t = c2/s;                     // t>0
        float rx = -(s+t) - c*4.0 + 2.0*m2;
        float ry =  (s-t)*sqrt(3.0);
        float rm = sqrt( rx*rx + ry*ry );
        co = ry/sqrt(rm-rx) + 2.0*g/rm;
    }
    co = (co-m)/2.0;

    float si = sqrt( max(1.0-co*co,0.0) );
 
    vec2 r = ab * vec2(co,si);
	
    return length(r-p) * msign(p.y-r.y);
}

vec3 render(vec2 coord)
{
    // center coord
    coord -= (res * .5);

    // transform (remember RORO: reverse order, reverse operation)
    coord -= transform_offset;
    coord *= rotate_2d(-radians(transform_rotation));
    coord.x -= transform_skew.x * coord.y;
    coord.y -= transform_skew.y * coord.x;
    coord /= transform_scale;

    // 2D index of the current tile
    ivec2 itile = ivec2(floor(coord / tile_size));

    // pixel position relative to the current tile's bottom left corner
    vec2 tile_coord = mod(coord, tile_size);
    
    // use sqrt(tile area) as a reference to scale elements
    float overall_scale = sqrt(tile_size.x * tile_size.y);

    float v = 0.;

    // border
    {
        float half_thickness = border_thickness * .5;
        float half_tile_w = tile_size.x * .5;
        float half_tile_h = tile_size.y * .5;
        v = max(
            inv_step(
                abs(tile_coord.x - half_tile_w),
                half_tile_w - half_thickness
            ),
            inv_step(
                abs(tile_coord.y - half_tile_h),
                half_tile_h - half_thickness
            )
        );
    }
    
    // grid lines
    {
        float grid_lines_res_x = max(
            ceil(sqrt(
                grid_lines_density * tile_size.x / tile_size.y
            )),
            1.
        );
        float grid_lines_res_y = max(
            ceil(grid_lines_density / float(grid_lines_res_x)),
            1.
        );

        vec2 grid_cell_size =
            tile_size / vec2(grid_lines_res_x, grid_lines_res_y);

        float half_thickness = grid_lines_thickness * .5;
        float half_cell_w = grid_cell_size.x * .5;
        float half_cell_h = grid_cell_size.y * .5;

        // vertical lines
        v = max(
            v,
            inv_step(
                abs(mod(tile_coord.x, grid_cell_size.x) - half_cell_w),
                half_cell_w - half_thickness
            ) * grid_lines_opacity_vertical
        );

        // horizontal lines
        v = max(
            v,
            inv_step(
                abs(mod(tile_coord.y, grid_cell_size.y) - half_cell_h),
                half_cell_h - half_thickness
            ) * grid_lines_opacity_horizontal
        );
    }

    // masjad
    {
        vec2 circle_center = vec2(
            tile_size.x * .5,
            tile_size.y * (1. - masjad_position)
        );
        float circle_radius = masjad_radius * overall_scale;

        float sd = distance(tile_coord, circle_center) - circle_radius;
        v = max(v, step(sd, 0.));
    }

    // feet
    {
        vec2 left_ellipse_center = vec2(
            tile_size.x * .5 - (feet_horizontal_distance * overall_scale),
            tile_size.y * feet_vertical_position
        );

        vec2 right_ellipse_center = vec2(
            tile_size.x * .5 + (feet_horizontal_distance * overall_scale),
            tile_size.y * feet_vertical_position
        );

        vec2 ellipse_radius = feet_size * overall_scale;
        float half_thickness = feet_thickness * .5;

        float sd = min(
            abs(sd_ellipse(
                tile_coord - left_ellipse_center,
                ellipse_radius
            )) - half_thickness,
            abs(sd_ellipse(
                tile_coord - right_ellipse_center,
                ellipse_radius
            )) - half_thickness
        );

        v = max(v, step(sd, 0.) * feet_opacity);
    }

    // colorize and return
    return mix(
        background_color,
        pattern_color,
        v
    );
}

vec3 view_transform(vec3 col)
{
    // OETF (Linear BT.709 -> sRGB 2.2)
    return pow(clamp(col, 0., 1.), vec3(1. / 2.2));
}

void main()
{
    // current pixel position
    vec2 frag_coord = gl_FragCoord.xy;

    // render (average multiple samples)
    vec3 col = vec3(0);
    const int N_SAMPLES = 32;
    for (int i = 0; i < N_SAMPLES; i++)
    {
        vec2 jitter_offs = vec2(
            hashf(ivec4(ivec2(floor(frag_coord)), i, 0)),
            hashf(ivec4(ivec2(floor(frag_coord)), i, 1))
        ) - .5;
        
        col += render(frag_coord + jitter_offs);
    }
    col /= float(N_SAMPLES);
    
    // output
    col = view_transform(col);
    out_color = vec4(col, 1);
}
`;
    try {
        // create graphics program (pipeline)
        state.program = create_program(state.gl, vertex_source, fragment_source);
        // fullscreen quad [-1, -1] to [1, 1]
        const quad_verts = new Float32Array([
            -1, -1,
            1, -1,
            -1, 1,
            -1, 1,
            1, -1,
            1, 1
        ]);
        // create vertex buffer object (VBO)
        state.vbo = state.gl.createBuffer();
        if (!state.vbo) {
            throw new Error("failed to create empty buffer");
        }
        state.gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, state.vbo);
        state.gl.bufferData(WebGL2RenderingContext.ARRAY_BUFFER, quad_verts, WebGL2RenderingContext.STATIC_DRAW);
        // define vertex attributes layout in the VBO
        const position_loc = state.gl.getAttribLocation(state.program, "a_position");
        state.gl.enableVertexAttribArray(position_loc);
        state.gl.vertexAttribPointer(position_loc, 2, WebGL2RenderingContext.FLOAT, false, 0, 0);
        // update state
        state.canvas_ready = true;
    }
    catch (error) {
        if (error instanceof Error) {
            console.error("failed to initialize canvas: ", error.message);
        }
        else {
            console.error("failed to initialize canvas: ", error);
        }
    }
}
function render_canvas() {
    if (state.canvas_ready !== true) {
        console.log("can't render because canvas is not ready.");
        return;
    }
    // bind graphics program (pipeline)
    state.gl.useProgram(state.program);
    // set uniforms
    {
        // render resolution
        set_uniform(state.gl, state.program, "res", new Vec2(state.canvas.width, state.canvas.height));
        // ordinary parameters
        for (const param of param_list.params) {
            if (typeof param.get() === "number"
                || param.get() instanceof Vec2
                || param.get() instanceof Vec3) {
                set_uniform(state.gl, state.program, param.id(), param.get());
            }
        }
        // colors
        let background_color = hsv_to_rgb([
            param_list.get("background_color_h").get(),
            param_list.get("background_color_s").get(),
            param_list.get("background_color_v").get()
        ]);
        let pattern_color = hsv_to_rgb([
            param_list.get("pattern_color_h").get(),
            param_list.get("pattern_color_s").get(),
            param_list.get("pattern_color_v").get()
        ]);
        set_uniform(state.gl, state.program, "background_color", arr_to_vec3(background_color));
        set_uniform(state.gl, state.program, "pattern_color", arr_to_vec3(pattern_color));
    }
    // bind VBO
    state.gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, state.vbo);
    // draw
    state.gl.clearColor(0, 0, 0, 1);
    state.gl.clear(WebGL2RenderingContext.COLOR_BUFFER_BIT);
    state.gl.drawArrays(WebGL2RenderingContext.TRIANGLES, 0, 6);
}
const param_json_prefix = "prayer pattern data\n";
function import_params() {
    load_text_from_file()
        .then(text => {
        if (!text.startsWith(param_json_prefix)) {
            console.error("incorrect data");
            return;
        }
        text = text.slice(param_json_prefix.length);
        param_list.deserialize(text);
        render_canvas();
    })
        .catch(err => {
        console.error(err);
    });
}
function export_params() {
    save_text_as_file("pattern.json", param_json_prefix + param_list.serialize());
}
