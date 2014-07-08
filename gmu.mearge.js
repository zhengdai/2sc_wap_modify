/**
 * Created by zd on 2014/5/18 0018.
 */
/* Zepto v1.0 - polyfill zepto detect event ajax form fx - zeptojs.com/license */
//     Zepto.js
//     (c) 2010-2012 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function(undefined){
    if (String.prototype.trim === undefined) // fix for iOS 3.2
        String.prototype.trim = function(){ return this.replace(/^\s+|\s+$/g, '') }

    // For iOS 3.x
    // from https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/reduce
    if (Array.prototype.reduce === undefined)
        Array.prototype.reduce = function(fun){
            if(this === void 0 || this === null) throw new TypeError()
            var t = Object(this), len = t.length >>> 0, k = 0, accumulator
            if(typeof fun != 'function') throw new TypeError()
            if(len == 0 && arguments.length == 1) throw new TypeError()

            if(arguments.length >= 2)
                accumulator = arguments[1]
            else
                do{
                    if(k in t){
                        accumulator = t[k++]
                        break
                    }
                    if(++k >= len) throw new TypeError()
                } while (true)

            while (k < len){
                if(k in t) accumulator = fun.call(undefined, accumulator, t[k], k, t)
                k++
            }
            return accumulator
        }

})()

//     Zepto.js
//     (c) 2010-2012 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

var Zepto = (function() {
    var undefined, key, $, classList, emptyArray = [], slice = emptyArray.slice, filter = emptyArray.filter,
        document = window.document,
        elementDisplay = {}, classCache = {},
        getComputedStyle = document.defaultView.getComputedStyle,
        cssNumber = { 'column-count': 1, 'columns': 1, 'font-weight': 1, 'line-height': 1,'opacity': 1, 'z-index': 1, 'zoom': 1 },
        fragmentRE = /^\s*<(\w+|!)[^>]*>/,
        tagExpanderRE = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
        rootNodeRE = /^(?:body|html)$/i,

    // special attributes that should be get/set via method calls
        methodAttributes = ['val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'],

        adjacencyOperators = [ 'after', 'prepend', 'before', 'append' ],
        table = document.createElement('table'),
        tableRow = document.createElement('tr'),
        containers = {
            'tr': document.createElement('tbody'),
            'tbody': table, 'thead': table, 'tfoot': table,
            'td': tableRow, 'th': tableRow,
            '*': document.createElement('div')
        },
        readyRE = /complete|loaded|interactive/,
        classSelectorRE = /^\.([\w-]+)$/,
        idSelectorRE = /^#([\w-]*)$/,
        tagSelectorRE = /^[\w-]+$/,
        class2type = {},
        toString = class2type.toString,
        zepto = {},
        camelize, uniq,
        tempParent = document.createElement('div')

    zepto.matches = function(element, selector) {
        if (!element || element.nodeType !== 1) return false
        var matchesSelector = element.webkitMatchesSelector || element.mozMatchesSelector ||
            element.oMatchesSelector || element.matchesSelector
        if (matchesSelector) return matchesSelector.call(element, selector)
        // fall back to performing a selector:
        var match, parent = element.parentNode, temp = !parent
        if (temp) (parent = tempParent).appendChild(element)
        match = ~zepto.qsa(parent, selector).indexOf(element)
        temp && tempParent.removeChild(element)
        return match
    }

    function type(obj) {
        return obj == null ? String(obj) :
            class2type[toString.call(obj)] || "object"
    }

    function isFunction(value) { return type(value) == "function" }
    function isWindow(obj)     { return obj != null && obj == obj.window }
    function isDocument(obj)   { return obj != null && obj.nodeType == obj.DOCUMENT_NODE }
    function isObject(obj)     { return type(obj) == "object" }
    function isPlainObject(obj) {
        return isObject(obj) && !isWindow(obj) && obj.__proto__ == Object.prototype
    }
    function isArray(value) { return value instanceof Array }
    function likeArray(obj) { return typeof obj.length == 'number' }

    function compact(array) { return filter.call(array, function(item){ return item != null }) }
    function flatten(array) { return array.length > 0 ? $.fn.concat.apply([], array) : array }
    camelize = function(str){ return str.replace(/-+(.)?/g, function(match, chr){ return chr ? chr.toUpperCase() : '' }) }
    function dasherize(str) {
        return str.replace(/::/g, '/')
            .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
            .replace(/([a-z\d])([A-Z])/g, '$1_$2')
            .replace(/_/g, '-')
            .toLowerCase()
    }
    uniq = function(array){ return filter.call(array, function(item, idx){ return array.indexOf(item) == idx }) }

    function classRE(name) {
        return name in classCache ?
            classCache[name] : (classCache[name] = new RegExp('(^|\\s)' + name + '(\\s|$)'))
    }

    function maybeAddPx(name, value) {
        return (typeof value == "number" && !cssNumber[dasherize(name)]) ? value + "px" : value
    }

    function defaultDisplay(nodeName) {
        var element, display
        if (!elementDisplay[nodeName]) {
            element = document.createElement(nodeName)
            document.body.appendChild(element)
            display = getComputedStyle(element, '').getPropertyValue("display")
            element.parentNode.removeChild(element)
            display == "none" && (display = "block")
            elementDisplay[nodeName] = display
        }
        return elementDisplay[nodeName]
    }

    function children(element) {
        return 'children' in element ?
            slice.call(element.children) :
            $.map(element.childNodes, function(node){ if (node.nodeType == 1) return node })
    }

    // `$.zepto.fragment` takes a html string and an optional tag name
    // to generate DOM nodes nodes from the given html string.
    // The generated DOM nodes are returned as an array.
    // This function can be overriden in plugins for example to make
    // it compatible with browsers that don't support the DOM fully.
    zepto.fragment = function(html, name, properties) {
        if (html.replace) html = html.replace(tagExpanderRE, "<$1></$2>")
        if (name === undefined) name = fragmentRE.test(html) && RegExp.$1
        if (!(name in containers)) name = '*'

        var nodes, dom, container = containers[name]
        container.innerHTML = '' + html
        dom = $.each(slice.call(container.childNodes), function(){
            container.removeChild(this)
        })
        if (isPlainObject(properties)) {
            nodes = $(dom)
            $.each(properties, function(key, value) {
                if (methodAttributes.indexOf(key) > -1) nodes[key](value)
                else nodes.attr(key, value)
            })
        }
        return dom
    }

    // `$.zepto.Z` swaps out the prototype of the given `dom` array
    // of nodes with `$.fn` and thus supplying all the Zepto functions
    // to the array. Note that `__proto__` is not supported on Internet
    // Explorer. This method can be overriden in plugins.
    zepto.Z = function(dom, selector) {
        dom = dom || []
        dom.__proto__ = $.fn
        dom.selector = selector || ''
        return dom
    }

    // `$.zepto.isZ` should return `true` if the given object is a Zepto
    // collection. This method can be overriden in plugins.
    zepto.isZ = function(object) {
        return object instanceof zepto.Z
    }

    // `$.zepto.init` is Zepto's counterpart to jQuery's `$.fn.init` and
    // takes a CSS selector and an optional context (and handles various
    // special cases).
    // This method can be overriden in plugins.
    zepto.init = function(selector, context) {
        // If nothing given, return an empty Zepto collection
        if (!selector) return zepto.Z()
        // If a function is given, call it when the DOM is ready
        else if (isFunction(selector)) return $(document).ready(selector)
        // If a Zepto collection is given, juts return it
        else if (zepto.isZ(selector)) return selector
        else {
            var dom
            // normalize array if an array of nodes is given
            if (isArray(selector)) dom = compact(selector)
            // Wrap DOM nodes. If a plain object is given, duplicate it.
            else if (isObject(selector))
                dom = [isPlainObject(selector) ? $.extend({}, selector) : selector], selector = null
            // If it's a html fragment, create nodes from it
            else if (fragmentRE.test(selector))
                dom = zepto.fragment(selector.trim(), RegExp.$1, context), selector = null
            // If there's a context, create a collection on that context first, and select
            // nodes from there
            else if (context !== undefined) return $(context).find(selector)
            // And last but no least, if it's a CSS selector, use it to select nodes.
            else dom = zepto.qsa(document, selector)
            // create a new Zepto collection from the nodes found
            return zepto.Z(dom, selector)
        }
    }

    // `$` will be the base `Zepto` object. When calling this
    // function just call `$.zepto.init, which makes the implementation
    // details of selecting nodes and creating Zepto collections
    // patchable in plugins.
    $ = function(selector, context){
        return zepto.init(selector, context)
    }

    function extend(target, source, deep) {
        for (key in source)
            if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
                if (isPlainObject(source[key]) && !isPlainObject(target[key]))
                    target[key] = {}
                if (isArray(source[key]) && !isArray(target[key]))
                    target[key] = []
                extend(target[key], source[key], deep)
            }
            else if (source[key] !== undefined) target[key] = source[key]
    }

    // Copy all but undefined properties from one or more
    // objects to the `target` object.
    $.extend = function(target){
        var deep, args = slice.call(arguments, 1)
        if (typeof target == 'boolean') {
            deep = target
            target = args.shift()
        }
        args.forEach(function(arg){ extend(target, arg, deep) })
        return target
    }

    // `$.zepto.qsa` is Zepto's CSS selector implementation which
    // uses `document.querySelectorAll` and optimizes for some special cases, like `#id`.
    // This method can be overriden in plugins.
    zepto.qsa = function(element, selector){
        var found
        return (isDocument(element) && idSelectorRE.test(selector)) ?
            ( (found = element.getElementById(RegExp.$1)) ? [found] : [] ) :
            (element.nodeType !== 1 && element.nodeType !== 9) ? [] :
                slice.call(
                    classSelectorRE.test(selector) ? element.getElementsByClassName(RegExp.$1) :
                        tagSelectorRE.test(selector) ? element.getElementsByTagName(selector) :
                            element.querySelectorAll(selector)
                )
    }

    function filtered(nodes, selector) {
        return selector === undefined ? $(nodes) : $(nodes).filter(selector)
    }

    $.contains = function(parent, node) {
        return parent !== node && parent.contains(node)
    }

    function funcArg(context, arg, idx, payload) {
        return isFunction(arg) ? arg.call(context, idx, payload) : arg
    }

    function setAttribute(node, name, value) {
        value == null ? node.removeAttribute(name) : node.setAttribute(name, value)
    }

    // access className property while respecting SVGAnimatedString
    function className(node, value){
        var klass = node.className,
            svg   = klass && klass.baseVal !== undefined

        if (value === undefined) return svg ? klass.baseVal : klass
        svg ? (klass.baseVal = value) : (node.className = value)
    }

    // "true"  => true
    // "false" => false
    // "null"  => null
    // "42"    => 42
    // "42.5"  => 42.5
    // JSON    => parse if valid
    // String  => self
    function deserializeValue(value) {
        var num
        try {
            return value ?
                value == "true" ||
                ( value == "false" ? false :
                        value == "null" ? null :
                    !isNaN(num = Number(value)) ? num :
                        /^[\[\{]/.test(value) ? $.parseJSON(value) :
                            value )
                : value
        } catch(e) {
            return value
        }
    }

    $.type = type
    $.isFunction = isFunction
    $.isWindow = isWindow
    $.isArray = isArray
    $.isPlainObject = isPlainObject

    $.isEmptyObject = function(obj) {
        var name
        for (name in obj) return false
        return true
    }

    $.inArray = function(elem, array, i){
        return emptyArray.indexOf.call(array, elem, i)
    }

    $.camelCase = camelize
    $.trim = function(str) { return str.trim() }

    // plugin compatibility
    $.uuid = 0
    $.support = { }
    $.expr = { }

    $.map = function(elements, callback){
        var value, values = [], i, key
        if (likeArray(elements))
            for (i = 0; i < elements.length; i++) {
                value = callback(elements[i], i)
                if (value != null) values.push(value)
            }
        else
            for (key in elements) {
                value = callback(elements[key], key)
                if (value != null) values.push(value)
            }
        return flatten(values)
    }

    $.each = function(elements, callback){
        var i, key
        if (likeArray(elements)) {
            for (i = 0; i < elements.length; i++)
                if (callback.call(elements[i], i, elements[i]) === false) return elements
        } else {
            for (key in elements)
                if (callback.call(elements[key], key, elements[key]) === false) return elements
        }

        return elements
    }

    $.grep = function(elements, callback){
        return filter.call(elements, callback)
    }

    if (window.JSON) $.parseJSON = JSON.parse

    // Populate the class2type map
    $.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
        class2type[ "[object " + name + "]" ] = name.toLowerCase()
    })

    // Define methods that will be available on all
    // Zepto collections
    $.fn = {
        // Because a collection acts like an array
        // copy over these useful array functions.
        forEach: emptyArray.forEach,
        reduce: emptyArray.reduce,
        push: emptyArray.push,
        sort: emptyArray.sort,
        indexOf: emptyArray.indexOf,
        concat: emptyArray.concat,

        // `map` and `slice` in the jQuery API work differently
        // from their array counterparts
        map: function(fn){
            return $($.map(this, function(el, i){ return fn.call(el, i, el) }))
        },
        slice: function(){
            return $(slice.apply(this, arguments))
        },

        ready: function(callback){
            if (readyRE.test(document.readyState)) callback($)
            else document.addEventListener('DOMContentLoaded', function(){ callback($) }, false)
            return this
        },
        get: function(idx){
            return idx === undefined ? slice.call(this) : this[idx >= 0 ? idx : idx + this.length]
        },
        toArray: function(){ return this.get() },
        size: function(){
            return this.length
        },
        remove: function(){
            return this.each(function(){
                if (this.parentNode != null)
                    this.parentNode.removeChild(this)
            })
        },
        each: function(callback){
            emptyArray.every.call(this, function(el, idx){
                return callback.call(el, idx, el) !== false
            })
            return this
        },
        filter: function(selector){
            if (isFunction(selector)) return this.not(this.not(selector))
            return $(filter.call(this, function(element){
                return zepto.matches(element, selector)
            }))
        },
        add: function(selector,context){
            return $(uniq(this.concat($(selector,context))))
        },
        is: function(selector){
            return this.length > 0 && zepto.matches(this[0], selector)
        },
        not: function(selector){
            var nodes=[]
            if (isFunction(selector) && selector.call !== undefined)
                this.each(function(idx){
                    if (!selector.call(this,idx)) nodes.push(this)
                })
            else {
                var excludes = typeof selector == 'string' ? this.filter(selector) :
                    (likeArray(selector) && isFunction(selector.item)) ? slice.call(selector) : $(selector)
                this.forEach(function(el){
                    if (excludes.indexOf(el) < 0) nodes.push(el)
                })
            }
            return $(nodes)
        },
        has: function(selector){
            return this.filter(function(){
                return isObject(selector) ?
                    $.contains(this, selector) :
                    $(this).find(selector).size()
            })
        },
        eq: function(idx){
            return idx === -1 ? this.slice(idx) : this.slice(idx, + idx + 1)
        },
        first: function(){
            var el = this[0]
            return el && !isObject(el) ? el : $(el)
        },
        last: function(){
            var el = this[this.length - 1]
            return el && !isObject(el) ? el : $(el)
        },
        find: function(selector){
            var result, $this = this
            if (typeof selector == 'object')
                result = $(selector).filter(function(){
                    var node = this
                    return emptyArray.some.call($this, function(parent){
                        return $.contains(parent, node)
                    })
                })
            else if (this.length == 1) result = $(zepto.qsa(this[0], selector))
            else result = this.map(function(){ return zepto.qsa(this, selector) })
            return result
        },
        closest: function(selector, context){
            var node = this[0], collection = false
            if (typeof selector == 'object') collection = $(selector)
            while (node && !(collection ? collection.indexOf(node) >= 0 : zepto.matches(node, selector)))
                node = node !== context && !isDocument(node) && node.parentNode
            return $(node)
        },
        parents: function(selector){
            var ancestors = [], nodes = this
            while (nodes.length > 0)
                nodes = $.map(nodes, function(node){
                    if ((node = node.parentNode) && !isDocument(node) && ancestors.indexOf(node) < 0) {
                        ancestors.push(node)
                        return node
                    }
                })
            return filtered(ancestors, selector)
        },
        parent: function(selector){
            return filtered(uniq(this.pluck('parentNode')), selector)
        },
        children: function(selector){
            return filtered(this.map(function(){ return children(this) }), selector)
        },
        contents: function() {
            return this.map(function() { return slice.call(this.childNodes) })
        },
        siblings: function(selector){
            return filtered(this.map(function(i, el){
                return filter.call(children(el.parentNode), function(child){ return child!==el })
            }), selector)
        },
        empty: function(){
            return this.each(function(){ this.innerHTML = '' })
        },
        // `pluck` is borrowed from Prototype.js
        pluck: function(property){
            return $.map(this, function(el){ return el[property] })
        },
        show: function(){
            return this.each(function(){
                this.style.display == "none" && (this.style.display = null)
                if (getComputedStyle(this, '').getPropertyValue("display") == "none")
                    this.style.display = defaultDisplay(this.nodeName)
            })
        },
        replaceWith: function(newContent){
            return this.before(newContent).remove()
        },
        wrap: function(structure){
            var func = isFunction(structure)
            if (this[0] && !func)
                var dom   = $(structure).get(0),
                    clone = dom.parentNode || this.length > 1

            return this.each(function(index){
                $(this).wrapAll(
                    func ? structure.call(this, index) :
                        clone ? dom.cloneNode(true) : dom
                )
            })
        },
        wrapAll: function(structure){
            if (this[0]) {
                $(this[0]).before(structure = $(structure))
                var children
                // drill down to the inmost element
                while ((children = structure.children()).length) structure = children.first()
                $(structure).append(this)
            }
            return this
        },
        wrapInner: function(structure){
            var func = isFunction(structure)
            return this.each(function(index){
                var self = $(this), contents = self.contents(),
                    dom  = func ? structure.call(this, index) : structure
                contents.length ? contents.wrapAll(dom) : self.append(dom)
            })
        },
        unwrap: function(){
            this.parent().each(function(){
                $(this).replaceWith($(this).children())
            })
            return this
        },
        clone: function(){
            return this.map(function(){ return this.cloneNode(true) })
        },
        hide: function(){
            return this.css("display", "none")
        },
        toggle: function(setting){
            return this.each(function(){
                var el = $(this)
                    ;(setting === undefined ? el.css("display") == "none" : setting) ? el.show() : el.hide()
            })
        },
        prev: function(selector){ return $(this.pluck('previousElementSibling')).filter(selector || '*') },
        next: function(selector){ return $(this.pluck('nextElementSibling')).filter(selector || '*') },
        html: function(html){
            return html === undefined ?
                (this.length > 0 ? this[0].innerHTML : null) :
                this.each(function(idx){
                    var originHtml = this.innerHTML
                    $(this).empty().append( funcArg(this, html, idx, originHtml) )
                })
        },
        text: function(text){
            return text === undefined ?
                (this.length > 0 ? this[0].textContent : null) :
                this.each(function(){ this.textContent = text })
        },
        attr: function(name, value){
            var result
            return (typeof name == 'string' && value === undefined) ?
                (this.length == 0 || this[0].nodeType !== 1 ? undefined :
                    (name == 'value' && this[0].nodeName == 'INPUT') ? this.val() :
                        (!(result = this[0].getAttribute(name)) && name in this[0]) ? this[0][name] : result
                    ) :
                this.each(function(idx){
                    if (this.nodeType !== 1) return
                    if (isObject(name)) for (key in name) setAttribute(this, key, name[key])
                    else setAttribute(this, name, funcArg(this, value, idx, this.getAttribute(name)))
                })
        },
        removeAttr: function(name){
            return this.each(function(){ this.nodeType === 1 && setAttribute(this, name) })
        },
        prop: function(name, value){
            return (value === undefined) ?
                (this[0] && this[0][name]) :
                this.each(function(idx){
                    this[name] = funcArg(this, value, idx, this[name])
                })
        },
        data: function(name, value){
            var data = this.attr('data-' + dasherize(name), value)
            return data !== null ? deserializeValue(data) : undefined
        },
        val: function(value){
            return (value === undefined) ?
                (this[0] && (this[0].multiple ?
                    $(this[0]).find('option').filter(function(o){ return this.selected }).pluck('value') :
                    this[0].value)
                    ) :
                this.each(function(idx){
                    this.value = funcArg(this, value, idx, this.value)
                })
        },
        offset: function(coordinates){
            if (coordinates) return this.each(function(index){
                var $this = $(this),
                    coords = funcArg(this, coordinates, index, $this.offset()),
                    parentOffset = $this.offsetParent().offset(),
                    props = {
                        top:  coords.top  - parentOffset.top,
                        left: coords.left - parentOffset.left
                    }

                if ($this.css('position') == 'static') props['position'] = 'relative'
                $this.css(props)
            })
            if (this.length==0) return null
            var obj = this[0].getBoundingClientRect()
            return {
                left: obj.left + window.pageXOffset,
                top: obj.top + window.pageYOffset,
                width: Math.round(obj.width),
                height: Math.round(obj.height)
            }
        },
        css: function(property, value){
            if (arguments.length < 2 && typeof property == 'string')
                return this[0] && (this[0].style[camelize(property)] || getComputedStyle(this[0], '').getPropertyValue(property))

            var css = ''
            if (type(property) == 'string') {
                if (!value && value !== 0)
                    this.each(function(){ this.style.removeProperty(dasherize(property)) })
                else
                    css = dasherize(property) + ":" + maybeAddPx(property, value)
            } else {
                for (key in property)
                    if (!property[key] && property[key] !== 0)
                        this.each(function(){ this.style.removeProperty(dasherize(key)) })
                    else
                        css += dasherize(key) + ':' + maybeAddPx(key, property[key]) + ';'
            }

            return this.each(function(){ this.style.cssText += ';' + css })
        },
        index: function(element){
            return element ? this.indexOf($(element)[0]) : this.parent().children().indexOf(this[0])
        },
        hasClass: function(name){
            return emptyArray.some.call(this, function(el){
                return this.test(className(el))
            }, classRE(name))
        },
        addClass: function(name){
            return this.each(function(idx){
                classList = []
                var cls = className(this), newName = funcArg(this, name, idx, cls)
                newName.split(/\s+/g).forEach(function(klass){
                    if (!$(this).hasClass(klass)) classList.push(klass)
                }, this)
                classList.length && className(this, cls + (cls ? " " : "") + classList.join(" "))
            })
        },
        removeClass: function(name){
            return this.each(function(idx){
                if (name === undefined) return className(this, '')
                classList = className(this)
                funcArg(this, name, idx, classList).split(/\s+/g).forEach(function(klass){
                    classList = classList.replace(classRE(klass), " ")
                })
                className(this, classList.trim())
            })
        },
        toggleClass: function(name, when){
            return this.each(function(idx){
                var $this = $(this), names = funcArg(this, name, idx, className(this))
                names.split(/\s+/g).forEach(function(klass){
                    (when === undefined ? !$this.hasClass(klass) : when) ?
                        $this.addClass(klass) : $this.removeClass(klass)
                })
            })
        },
        scrollTop: function(){
            if (!this.length) return
            return ('scrollTop' in this[0]) ? this[0].scrollTop : this[0].scrollY
        },
        position: function() {
            if (!this.length) return

            var elem = this[0],
            // Get *real* offsetParent
                offsetParent = this.offsetParent(),
            // Get correct offsets
                offset       = this.offset(),
                parentOffset = rootNodeRE.test(offsetParent[0].nodeName) ? { top: 0, left: 0 } : offsetParent.offset()

            // Subtract element margins
            // note: when an element has margin: auto the offsetLeft and marginLeft
            // are the same in Safari causing offset.left to incorrectly be 0
            offset.top  -= parseFloat( $(elem).css('margin-top') ) || 0
            offset.left -= parseFloat( $(elem).css('margin-left') ) || 0

            // Add offsetParent borders
            parentOffset.top  += parseFloat( $(offsetParent[0]).css('border-top-width') ) || 0
            parentOffset.left += parseFloat( $(offsetParent[0]).css('border-left-width') ) || 0

            // Subtract the two offsets
            return {
                top:  offset.top  - parentOffset.top,
                left: offset.left - parentOffset.left
            }
        },
        offsetParent: function() {
            return this.map(function(){
                var parent = this.offsetParent || document.body
                while (parent && !rootNodeRE.test(parent.nodeName) && $(parent).css("position") == "static")
                    parent = parent.offsetParent
                return parent
            })
        }
    }

    // for now
    $.fn.detach = $.fn.remove

        // Generate the `width` and `height` functions
    ;['width', 'height'].forEach(function(dimension){
        $.fn[dimension] = function(value){
            var offset, el = this[0],
                Dimension = dimension.replace(/./, function(m){ return m[0].toUpperCase() })
            if (value === undefined) return isWindow(el) ? el['inner' + Dimension] :
                isDocument(el) ? el.documentElement['offset' + Dimension] :
                    (offset = this.offset()) && offset[dimension]
            else return this.each(function(idx){
                el = $(this)
                el.css(dimension, funcArg(this, value, idx, el[dimension]()))
            })
        }
    })

    function traverseNode(node, fun) {
        fun(node)
        for (var key in node.childNodes) traverseNode(node.childNodes[key], fun)
    }

    // Generate the `after`, `prepend`, `before`, `append`,
    // `insertAfter`, `insertBefore`, `appendTo`, and `prependTo` methods.
    adjacencyOperators.forEach(function(operator, operatorIndex) {
        var inside = operatorIndex % 2 //=> prepend, append

        $.fn[operator] = function(){
            // arguments can be nodes, arrays of nodes, Zepto objects and HTML strings
            var argType, nodes = $.map(arguments, function(arg) {
                    argType = type(arg)
                    return argType == "object" || argType == "array" || arg == null ?
                        arg : zepto.fragment(arg)
                }),
                parent, copyByClone = this.length > 1
            if (nodes.length < 1) return this

            return this.each(function(_, target){
                parent = inside ? target : target.parentNode

                // convert all methods to a "before" operation
                target = operatorIndex == 0 ? target.nextSibling :
                        operatorIndex == 1 ? target.firstChild :
                        operatorIndex == 2 ? target :
                    null

                nodes.forEach(function(node){
                    if (copyByClone) node = node.cloneNode(true)
                    else if (!parent) return $(node).remove()

                    traverseNode(parent.insertBefore(node, target), function(el){
                        if (el.nodeName != null && el.nodeName.toUpperCase() === 'SCRIPT' &&
                            (!el.type || el.type === 'text/javascript') && !el.src)
                            window['eval'].call(window, el.innerHTML)
                    })
                })
            })
        }

        // after    => insertAfter
        // prepend  => prependTo
        // before   => insertBefore
        // append   => appendTo
        $.fn[inside ? operator+'To' : 'insert'+(operatorIndex ? 'Before' : 'After')] = function(html){
            $(html)[operator](this)
            return this
        }
    })

    zepto.Z.prototype = $.fn

    // Export internal API functions in the `$.zepto` namespace
    zepto.uniq = uniq
    zepto.deserializeValue = deserializeValue
    $.zepto = zepto

    return $
})()

// If `$` is not yet defined, point it to `Zepto`
window.Zepto = Zepto
'$' in window || (window.$ = Zepto)

//     Zepto.js
//     (c) 2010-2012 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($){
    function detect(ua){
        var os = this.os = {}, browser = this.browser = {},
            webkit = ua.match(/WebKit\/([\d.]+)/),
            android = ua.match(/(Android)\s+([\d.]+)/),
            ipad = ua.match(/(iPad).*OS\s([\d_]+)/),
            iphone = !ipad && ua.match(/(iPhone\sOS)\s([\d_]+)/),
            webos = ua.match(/(webOS|hpwOS)[\s\/]([\d.]+)/),
            touchpad = webos && ua.match(/TouchPad/),
            kindle = ua.match(/Kindle\/([\d.]+)/),
            silk = ua.match(/Silk\/([\d._]+)/),
            blackberry = ua.match(/(BlackBerry).*Version\/([\d.]+)/),
            bb10 = ua.match(/(BB10).*Version\/([\d.]+)/),
            rimtabletos = ua.match(/(RIM\sTablet\sOS)\s([\d.]+)/),
            playbook = ua.match(/PlayBook/),
            chrome = ua.match(/Chrome\/([\d.]+)/) || ua.match(/CriOS\/([\d.]+)/),
            firefox = ua.match(/Firefox\/([\d.]+)/)

        // Todo: clean this up with a better OS/browser seperation:
        // - discern (more) between multiple browsers on android
        // - decide if kindle fire in silk mode is android or not
        // - Firefox on Android doesn't specify the Android version
        // - possibly devide in os, device and browser hashes

        if (browser.webkit = !!webkit) browser.version = webkit[1]

        if (android) os.android = true, os.version = android[2]
        if (iphone) os.ios = os.iphone = true, os.version = iphone[2].replace(/_/g, '.')
        if (ipad) os.ios = os.ipad = true, os.version = ipad[2].replace(/_/g, '.')
        if (webos) os.webos = true, os.version = webos[2]
        if (touchpad) os.touchpad = true
        if (blackberry) os.blackberry = true, os.version = blackberry[2]
        if (bb10) os.bb10 = true, os.version = bb10[2]
        if (rimtabletos) os.rimtabletos = true, os.version = rimtabletos[2]
        if (playbook) browser.playbook = true
        if (kindle) os.kindle = true, os.version = kindle[1]
        if (silk) browser.silk = true, browser.version = silk[1]
        if (!silk && os.android && ua.match(/Kindle Fire/)) browser.silk = true
        if (chrome) browser.chrome = true, browser.version = chrome[1]
        if (firefox) browser.firefox = true, browser.version = firefox[1]

        os.tablet = !!(ipad || playbook || (android && !ua.match(/Mobile/)) || (firefox && ua.match(/Tablet/)))
        os.phone  = !!(!os.tablet && (android || iphone || webos || blackberry || bb10 ||
            (chrome && ua.match(/Android/)) || (chrome && ua.match(/CriOS\/([\d.]+)/)) || (firefox && ua.match(/Mobile/))))
    }

    detect.call($, navigator.userAgent)
    // make available to unit tests
    $.__detect = detect

})(Zepto)

//     Zepto.js
//     (c) 2010-2012 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($){
    var $$ = $.zepto.qsa, handlers = {}, _zid = 1, specialEvents={},
        hover = { mouseenter: 'mouseover', mouseleave: 'mouseout' }

    specialEvents.click = specialEvents.mousedown = specialEvents.mouseup = specialEvents.mousemove = 'MouseEvents'

    function zid(element) {
        return element._zid || (element._zid = _zid++)
    }
    function findHandlers(element, event, fn, selector) {
        event = parse(event)
        if (event.ns) var matcher = matcherFor(event.ns)
        return (handlers[zid(element)] || []).filter(function(handler) {
            return handler
                && (!event.e  || handler.e == event.e)
                && (!event.ns || matcher.test(handler.ns))
                && (!fn       || zid(handler.fn) === zid(fn))
                && (!selector || handler.sel == selector)
        })
    }
    function parse(event) {
        var parts = ('' + event).split('.')
        return {e: parts[0], ns: parts.slice(1).sort().join(' ')}
    }
    function matcherFor(ns) {
        return new RegExp('(?:^| )' + ns.replace(' ', ' .* ?') + '(?: |$)')
    }

    function eachEvent(events, fn, iterator){
        if ($.type(events) != "string") $.each(events, iterator)
        else events.split(/\s/).forEach(function(type){ iterator(type, fn) })
    }

    function eventCapture(handler, captureSetting) {
        return handler.del &&
            (handler.e == 'focus' || handler.e == 'blur') ||
            !!captureSetting
    }

    function realEvent(type) {
        return hover[type] || type
    }

    function add(element, events, fn, selector, getDelegate, capture){
        var id = zid(element), set = (handlers[id] || (handlers[id] = []))
        eachEvent(events, fn, function(event, fn){
            var handler   = parse(event)
            handler.fn    = fn
            handler.sel   = selector
            // emulate mouseenter, mouseleave
            if (handler.e in hover) fn = function(e){
                var related = e.relatedTarget
                if (!related || (related !== this && !$.contains(this, related)))
                    return handler.fn.apply(this, arguments)
            }
            handler.del   = getDelegate && getDelegate(fn, event)
            var callback  = handler.del || fn
            handler.proxy = function (e) {
                var result = callback.apply(element, [e].concat(e.data))
                if (result === false) e.preventDefault(), e.stopPropagation()
                return result
            }
            handler.i = set.length
            set.push(handler)
            element.addEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
        })
    }
    function remove(element, events, fn, selector, capture){
        var id = zid(element)
        eachEvent(events || '', fn, function(event, fn){
            findHandlers(element, event, fn, selector).forEach(function(handler){
                delete handlers[id][handler.i]
                element.removeEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
            })
        })
    }

    $.event = { add: add, remove: remove }

    $.proxy = function(fn, context) {
        if ($.isFunction(fn)) {
            var proxyFn = function(){ return fn.apply(context, arguments) }
            proxyFn._zid = zid(fn)
            return proxyFn
        } else if (typeof context == 'string') {
            return $.proxy(fn[context], fn)
        } else {
            throw new TypeError("expected function")
        }
    }

    $.fn.bind = function(event, callback){
        return this.each(function(){
            add(this, event, callback)
        })
    }
    $.fn.unbind = function(event, callback){
        return this.each(function(){
            remove(this, event, callback)
        })
    }
    $.fn.one = function(event, callback){
        return this.each(function(i, element){
            add(this, event, callback, null, function(fn, type){
                return function(){
                    var result = fn.apply(element, arguments)
                    remove(element, type, fn)
                    return result
                }
            })
        })
    }

    var returnTrue = function(){return true},
        returnFalse = function(){return false},
        ignoreProperties = /^([A-Z]|layer[XY]$)/,
        eventMethods = {
            preventDefault: 'isDefaultPrevented',
            stopImmediatePropagation: 'isImmediatePropagationStopped',
            stopPropagation: 'isPropagationStopped'
        }
    function createProxy(event) {
        var key, proxy = { originalEvent: event }
        for (key in event)
            if (!ignoreProperties.test(key) && event[key] !== undefined) proxy[key] = event[key]

        $.each(eventMethods, function(name, predicate) {
            proxy[name] = function(){
                this[predicate] = returnTrue
                return event[name].apply(event, arguments)
            }
            proxy[predicate] = returnFalse
        })
        return proxy
    }

    // emulates the 'defaultPrevented' property for browsers that have none
    function fix(event) {
        if (!('defaultPrevented' in event)) {
            event.defaultPrevented = false
            var prevent = event.preventDefault
            event.preventDefault = function() {
                this.defaultPrevented = true
                prevent.call(this)
            }
        }
    }

    $.fn.delegate = function(selector, event, callback){
        return this.each(function(i, element){
            add(element, event, callback, selector, function(fn){
                return function(e){
                    var evt, match = $(e.target).closest(selector, element).get(0)
                    if (match) {
                        evt = $.extend(createProxy(e), {currentTarget: match, liveFired: element})
                        return fn.apply(match, [evt].concat([].slice.call(arguments, 1)))
                    }
                }
            })
        })
    }
    $.fn.undelegate = function(selector, event, callback){
        return this.each(function(){
            remove(this, event, callback, selector)
        })
    }

    $.fn.live = function(event, callback){
        $(document.body).delegate(this.selector, event, callback)
        return this
    }
    $.fn.die = function(event, callback){
        $(document.body).undelegate(this.selector, event, callback)
        return this
    }

    $.fn.on = function(event, selector, callback){
        return !selector || $.isFunction(selector) ?
            this.bind(event, selector || callback) : this.delegate(selector, event, callback)
    }
    $.fn.off = function(event, selector, callback){
        return !selector || $.isFunction(selector) ?
            this.unbind(event, selector || callback) : this.undelegate(selector, event, callback)
    }

    $.fn.trigger = function(event, data){
        if (typeof event == 'string' || $.isPlainObject(event)) event = $.Event(event)
        fix(event)
        event.data = data
        return this.each(function(){
            // items in the collection might not be DOM elements
            // (todo: possibly support events on plain old objects)
            if('dispatchEvent' in this) this.dispatchEvent(event)
        })
    }

    // triggers event handlers on current element just as if an event occurred,
    // doesn't trigger an actual event, doesn't bubble
    $.fn.triggerHandler = function(event, data){
        var e, result
        this.each(function(i, element){
            e = createProxy(typeof event == 'string' ? $.Event(event) : event)
            e.data = data
            e.target = element
            $.each(findHandlers(element, event.type || event), function(i, handler){
                result = handler.proxy(e)
                if (e.isImmediatePropagationStopped()) return false
            })
        })
        return result
    }

        // shortcut methods for `.bind(event, fn)` for each event type
    ;('focusin focusout load resize scroll unload click dblclick '+
        'mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave '+
        'change select keydown keypress keyup error').split(' ').forEach(function(event) {
            $.fn[event] = function(callback) {
                return callback ?
                    this.bind(event, callback) :
                    this.trigger(event)
            }
        })

    ;['focus', 'blur'].forEach(function(name) {
        $.fn[name] = function(callback) {
            if (callback) this.bind(name, callback)
            else this.each(function(){
                try { this[name]() }
                catch(e) {}
            })
            return this
        }
    })

    $.Event = function(type, props) {
        if (typeof type != 'string') props = type, type = props.type
        var event = document.createEvent(specialEvents[type] || 'Events'), bubbles = true
        if (props) for (var name in props) (name == 'bubbles') ? (bubbles = !!props[name]) : (event[name] = props[name])
        event.initEvent(type, bubbles, true, null, null, null, null, null, null, null, null, null, null, null, null)
        event.isDefaultPrevented = function(){ return this.defaultPrevented }
        return event
    }

})(Zepto)

//     Zepto.js
//     (c) 2010-2012 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($){
    var jsonpID = 0,
        document = window.document,
        key,
        name,
        rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        scriptTypeRE = /^(?:text|application)\/javascript/i,
        xmlTypeRE = /^(?:text|application)\/xml/i,
        jsonType = 'application/json',
        htmlType = 'text/html',
        blankRE = /^\s*$/

    // trigger a custom event and return false if it was cancelled
    function triggerAndReturn(context, eventName, data) {
        var event = $.Event(eventName)
        $(context).trigger(event, data)
        return !event.defaultPrevented
    }

    // trigger an Ajax "global" event
    function triggerGlobal(settings, context, eventName, data) {
        if (settings.global) return triggerAndReturn(context || document, eventName, data)
    }

    // Number of active Ajax requests
    $.active = 0

    function ajaxStart(settings) {
        if (settings.global && $.active++ === 0) triggerGlobal(settings, null, 'ajaxStart')
    }
    function ajaxStop(settings) {
        if (settings.global && !(--$.active)) triggerGlobal(settings, null, 'ajaxStop')
    }

    // triggers an extra global event "ajaxBeforeSend" that's like "ajaxSend" but cancelable
    function ajaxBeforeSend(xhr, settings) {
        var context = settings.context
        if (settings.beforeSend.call(context, xhr, settings) === false ||
            triggerGlobal(settings, context, 'ajaxBeforeSend', [xhr, settings]) === false)
            return false

        triggerGlobal(settings, context, 'ajaxSend', [xhr, settings])
    }
    function ajaxSuccess(data, xhr, settings) {
        var context = settings.context, status = 'success'
        settings.success.call(context, data, status, xhr)
        triggerGlobal(settings, context, 'ajaxSuccess', [xhr, settings, data])
        ajaxComplete(status, xhr, settings)
    }
    // type: "timeout", "error", "abort", "parsererror"
    function ajaxError(error, type, xhr, settings) {
        var context = settings.context
        settings.error.call(context, xhr, type, error)
        triggerGlobal(settings, context, 'ajaxError', [xhr, settings, error])
        ajaxComplete(type, xhr, settings)
    }
    // status: "success", "notmodified", "error", "timeout", "abort", "parsererror"
    function ajaxComplete(status, xhr, settings) {
        var context = settings.context
        settings.complete.call(context, xhr, status)
        triggerGlobal(settings, context, 'ajaxComplete', [xhr, settings])
        ajaxStop(settings)
    }

    // Empty function, used as default callback
    function empty() {}

    $.ajaxJSONP = function(options){
        if (!('type' in options)) return $.ajax(options)

        var callbackName = 'jsonp' + (++jsonpID),
            script = document.createElement('script'),
            cleanup = function() {
                clearTimeout(abortTimeout)
                $(script).remove()
                delete window[callbackName]
            },
            abort = function(type){
                cleanup()
                // In case of manual abort or timeout, keep an empty function as callback
                // so that the SCRIPT tag that eventually loads won't result in an error.
                if (!type || type == 'timeout') window[callbackName] = empty
                ajaxError(null, type || 'abort', xhr, options)
            },
            xhr = { abort: abort }, abortTimeout

        if (ajaxBeforeSend(xhr, options) === false) {
            abort('abort')
            return false
        }

        window[callbackName] = function(data){
            cleanup()
            ajaxSuccess(data, xhr, options)
        }

        script.onerror = function() { abort('error') }

        script.src = options.url.replace(/=\?/, '=' + callbackName)
        $('head').append(script)

        if (options.timeout > 0) abortTimeout = setTimeout(function(){
            abort('timeout')
        }, options.timeout)

        return xhr
    }

    $.ajaxSettings = {
        // Default type of request
        type: 'GET',
        // Callback that is executed before request
        beforeSend: empty,
        // Callback that is executed if the request succeeds
        success: empty,
        // Callback that is executed the the server drops error
        error: empty,
        // Callback that is executed on request complete (both: error and success)
        complete: empty,
        // The context for the callbacks
        context: null,
        // Whether to trigger "global" Ajax events
        global: true,
        // Transport
        xhr: function () {
            return new window.XMLHttpRequest()
        },
        // MIME types mapping
        accepts: {
            script: 'text/javascript, application/javascript',
            json:   jsonType,
            xml:    'application/xml, text/xml',
            html:   htmlType,
            text:   'text/plain'
        },
        // Whether the request is to another domain
        crossDomain: false,
        // Default timeout
        timeout: 0,
        // Whether data should be serialized to string
        processData: true,
        // Whether the browser should be allowed to cache GET responses
        cache: true
    }

    function mimeToDataType(mime) {
        if (mime) mime = mime.split(';', 2)[0]
        return mime && ( mime == htmlType ? 'html' :
                mime == jsonType ? 'json' :
            scriptTypeRE.test(mime) ? 'script' :
                xmlTypeRE.test(mime) && 'xml' ) || 'text'
    }

    function appendQuery(url, query) {
        return (url + '&' + query).replace(/[&?]{1,2}/, '?')
    }

    // serialize payload and append it to the URL for GET requests
    function serializeData(options) {
        if (options.processData && options.data && $.type(options.data) != "string")
            options.data = $.param(options.data, options.traditional)
        if (options.data && (!options.type || options.type.toUpperCase() == 'GET'))
            options.url = appendQuery(options.url, options.data)
    }

    $.ajax = function(options){
        var settings = $.extend({}, options || {})
        for (key in $.ajaxSettings) if (settings[key] === undefined) settings[key] = $.ajaxSettings[key]

        ajaxStart(settings)

        if (!settings.crossDomain) settings.crossDomain = /^([\w-]+:)?\/\/([^\/]+)/.test(settings.url) &&
            RegExp.$2 != window.location.host

        if (!settings.url) settings.url = window.location.toString()
        serializeData(settings)
        if (settings.cache === false) settings.url = appendQuery(settings.url, '_=' + Date.now())

        var dataType = settings.dataType, hasPlaceholder = /=\?/.test(settings.url)
        if (dataType == 'jsonp' || hasPlaceholder) {
            if (!hasPlaceholder) settings.url = appendQuery(settings.url, 'callback=?')
            return $.ajaxJSONP(settings)
        }

        var mime = settings.accepts[dataType],
            baseHeaders = { },
            protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.$1 : window.location.protocol,
            xhr = settings.xhr(), abortTimeout

        if (!settings.crossDomain) baseHeaders['X-Requested-With'] = 'XMLHttpRequest'
        if (mime) {
            baseHeaders['Accept'] = mime
            if (mime.indexOf(',') > -1) mime = mime.split(',', 2)[0]
            xhr.overrideMimeType && xhr.overrideMimeType(mime)
        }
        if (settings.contentType || (settings.contentType !== false && settings.data && settings.type.toUpperCase() != 'GET'))
            baseHeaders['Content-Type'] = (settings.contentType || 'application/x-www-form-urlencoded')
        settings.headers = $.extend(baseHeaders, settings.headers || {})

        xhr.onreadystatechange = function(){
            if (xhr.readyState == 4) {
                xhr.onreadystatechange = empty;
                clearTimeout(abortTimeout)
                var result, error = false
                if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304 || (xhr.status == 0 && protocol == 'file:')) {
                    dataType = dataType || mimeToDataType(xhr.getResponseHeader('content-type'))
                    result = xhr.responseText

                    try {
                        // http://perfectionkills.com/global-eval-what-are-the-options/
                        if (dataType == 'script')    (1,eval)(result)
                        else if (dataType == 'xml')  result = xhr.responseXML
                        else if (dataType == 'json') result = blankRE.test(result) ? null : $.parseJSON(result)
                    } catch (e) { error = e }

                    if (error) ajaxError(error, 'parsererror', xhr, settings)
                    else ajaxSuccess(result, xhr, settings)
                } else {
                    ajaxError(null, xhr.status ? 'error' : 'abort', xhr, settings)
                }
            }
        }

        var async = 'async' in settings ? settings.async : true
        xhr.open(settings.type, settings.url, async)

        for (name in settings.headers) xhr.setRequestHeader(name, settings.headers[name])

        if (ajaxBeforeSend(xhr, settings) === false) {
            xhr.abort()
            return false
        }

        if (settings.timeout > 0) abortTimeout = setTimeout(function(){
            xhr.onreadystatechange = empty
            xhr.abort()
            ajaxError(null, 'timeout', xhr, settings)
        }, settings.timeout)

        // avoid sending empty string (#319)
        xhr.send(settings.data ? settings.data : null)
        return xhr
    }

    // handle optional data/success arguments
    function parseArguments(url, data, success, dataType) {
        var hasData = !$.isFunction(data)
        return {
            url:      url,
            data:     hasData  ? data : undefined,
            success:  !hasData ? data : $.isFunction(success) ? success : undefined,
            dataType: hasData  ? dataType || success : success
        }
    }

    $.get = function(url, data, success, dataType){
        return $.ajax(parseArguments.apply(null, arguments))
    }

    $.post = function(url, data, success, dataType){
        var options = parseArguments.apply(null, arguments)
        options.type = 'POST'
        return $.ajax(options)
    }

    $.getJSON = function(url, data, success){
        var options = parseArguments.apply(null, arguments)
        options.dataType = 'json'
        return $.ajax(options)
    }

    $.fn.load = function(url, data, success){
        if (!this.length) return this
        var self = this, parts = url.split(/\s/), selector,
            options = parseArguments(url, data, success),
            callback = options.success
        if (parts.length > 1) options.url = parts[0], selector = parts[1]
        options.success = function(response){
            self.html(selector ?
                $('<div>').html(response.replace(rscript, "")).find(selector)
                : response)
            callback && callback.apply(self, arguments)
        }
        $.ajax(options)
        return this
    }

    var escape = encodeURIComponent

    function serialize(params, obj, traditional, scope){
        var type, array = $.isArray(obj)
        $.each(obj, function(key, value) {
            type = $.type(value)
            if (scope) key = traditional ? scope : scope + '[' + (array ? '' : key) + ']'
            // handle data in serializeArray() format
            if (!scope && array) params.add(value.name, value.value)
            // recurse into nested objects
            else if (type == "array" || (!traditional && type == "object"))
                serialize(params, value, traditional, key)
            else params.add(key, value)
        })
    }

    $.param = function(obj, traditional){
        var params = []
        params.add = function(k, v){ this.push(escape(k) + '=' + escape(v)) }
        serialize(params, obj, traditional)
        return params.join('&').replace(/%20/g, '+')
    }
})(Zepto)

//     Zepto.js
//     (c) 2010-2012 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function ($) {
    $.fn.serializeArray = function () {
        var result = [], el
        $( Array.prototype.slice.call(this.get(0).elements) ).each(function () {
            el = $(this)
            var type = el.attr('type')
            if (this.nodeName.toLowerCase() != 'fieldset' &&
                !this.disabled && type != 'submit' && type != 'reset' && type != 'button' &&
                ((type != 'radio' && type != 'checkbox') || this.checked))
                result.push({
                    name: el.attr('name'),
                    value: el.val()
                })
        })
        return result
    }

    $.fn.serialize = function () {
        var result = []
        this.serializeArray().forEach(function (elm) {
            result.push( encodeURIComponent(elm.name) + '=' + encodeURIComponent(elm.value) )
        })
        return result.join('&')
    }

    $.fn.submit = function (callback) {
        if (callback) this.bind('submit', callback)
        else if (this.length) {
            var event = $.Event('submit')
            this.eq(0).trigger(event)
            if (!event.defaultPrevented) this.get(0).submit()
        }
        return this
    }

})(Zepto)

//     Zepto.js
//     (c) 2010-2012 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($, undefined){
    var prefix = '', eventPrefix, endEventName, endAnimationName,
        vendors = { Webkit: 'webkit', Moz: '', O: 'o', ms: 'MS' },
        document = window.document, testEl = document.createElement('div'),
        supportedTransforms = /^((translate|rotate|scale)(X|Y|Z|3d)?|matrix(3d)?|perspective|skew(X|Y)?)$/i,
        transform,
        transitionProperty, transitionDuration, transitionTiming,
        animationName, animationDuration, animationTiming,
        cssReset = {}

    function dasherize(str) { return downcase(str.replace(/([a-z])([A-Z])/, '$1-$2')) }
    function downcase(str) { return str.toLowerCase() }
    function normalizeEvent(name) { return eventPrefix ? eventPrefix + name : downcase(name) }

    $.each(vendors, function(vendor, event){
        if (testEl.style[vendor + 'TransitionProperty'] !== undefined) {
            prefix = '-' + downcase(vendor) + '-'
            eventPrefix = event
            return false
        }
    })

    transform = prefix + 'transform'
    cssReset[transitionProperty = prefix + 'transition-property'] =
        cssReset[transitionDuration = prefix + 'transition-duration'] =
            cssReset[transitionTiming   = prefix + 'transition-timing-function'] =
                cssReset[animationName      = prefix + 'animation-name'] =
                    cssReset[animationDuration  = prefix + 'animation-duration'] =
                        cssReset[animationTiming    = prefix + 'animation-timing-function'] = ''

    $.fx = {
        off: (eventPrefix === undefined && testEl.style.transitionProperty === undefined),
        speeds: { _default: 400, fast: 200, slow: 600 },
        cssPrefix: prefix,
        transitionEnd: normalizeEvent('TransitionEnd'),
        animationEnd: normalizeEvent('AnimationEnd')
    }

    $.fn.animate = function(properties, duration, ease, callback){
        if ($.isPlainObject(duration))
            ease = duration.easing, callback = duration.complete, duration = duration.duration
        if (duration) duration = (typeof duration == 'number' ? duration :
            ($.fx.speeds[duration] || $.fx.speeds._default)) / 1000
        return this.anim(properties, duration, ease, callback)
    }

    $.fn.anim = function(properties, duration, ease, callback){
        var key, cssValues = {}, cssProperties, transforms = '',
            that = this, wrappedCallback, endEvent = $.fx.transitionEnd

        if (duration === undefined) duration = 0.4
        if ($.fx.off) duration = 0

        if (typeof properties == 'string') {
            // keyframe animation
            cssValues[animationName] = properties
            cssValues[animationDuration] = duration + 's'
            cssValues[animationTiming] = (ease || 'linear')
            endEvent = $.fx.animationEnd
        } else {
            cssProperties = []
            // CSS transitions
            for (key in properties)
                if (supportedTransforms.test(key)) transforms += key + '(' + properties[key] + ') '
                else cssValues[key] = properties[key], cssProperties.push(dasherize(key))

            if (transforms) cssValues[transform] = transforms, cssProperties.push(transform)
            if (duration > 0 && typeof properties === 'object') {
                cssValues[transitionProperty] = cssProperties.join(', ')
                cssValues[transitionDuration] = duration + 's'
                cssValues[transitionTiming] = (ease || 'linear')
            }
        }

        wrappedCallback = function(event){
            if (typeof event !== 'undefined') {
                if (event.target !== event.currentTarget) return // makes sure the event didn't bubble from "below"
                $(event.target).unbind(endEvent, wrappedCallback)
            }
            $(this).css(cssReset)
            callback && callback.call(this)
        }
        if (duration > 0) this.bind(endEvent, wrappedCallback)

        // trigger page reflow so new elements can animate
        this.size() && this.get(0).clientLeft

        this.css(cssValues)

        if (duration <= 0) setTimeout(function() {
            that.each(function(){ wrappedCallback.call(this) })
        }, 0)

        return this
    }

    testEl = null
})(Zepto);

/**
 * @file ����zepto/touch.js, zepto��1.0���Ѳ�Ĭ�ϴ�����ļ���
 * @import zepto.js
 */
//     Zepto.js
//     (c) 2010-2012 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($){
    var touch = {},
        touchTimeout, tapTimeout, swipeTimeout,
        longTapDelay = 750, longTapTimeout

    function parentIfText(node) {
        return 'tagName' in node ? node : node.parentNode
    }

    function swipeDirection(x1, x2, y1, y2) {
        var xDelta = Math.abs(x1 - x2), yDelta = Math.abs(y1 - y2)
        return xDelta >= yDelta ? (x1 - x2 > 0 ? 'Left' : 'Right') : (y1 - y2 > 0 ? 'Up' : 'Down')
    }

    function longTap() {
        longTapTimeout = null
        if (touch.last) {
            touch.el.trigger('longTap')
            touch = {}
        }
    }

    function cancelLongTap() {
        if (longTapTimeout) clearTimeout(longTapTimeout)
        longTapTimeout = null
    }

    function cancelAll() {
        if (touchTimeout) clearTimeout(touchTimeout)
        if (tapTimeout) clearTimeout(tapTimeout)
        if (swipeTimeout) clearTimeout(swipeTimeout)
        if (longTapTimeout) clearTimeout(longTapTimeout)
        touchTimeout = tapTimeout = swipeTimeout = longTapTimeout = null
        touch = {}
    }

    $(document).ready(function(){
        var now, delta

        $(document.body)
            .bind('touchstart', function(e){
                now = Date.now()
                delta = now - (touch.last || now)
                touch.el = $(parentIfText(e.touches[0].target))
                touchTimeout && clearTimeout(touchTimeout)
                touch.x1 = e.touches[0].pageX
                touch.y1 = e.touches[0].pageY
                if (delta > 0 && delta <= 250) touch.isDoubleTap = true
                touch.last = now
                longTapTimeout = setTimeout(longTap, longTapDelay)
            })
            .bind('touchmove', function(e){
                cancelLongTap()
                touch.x2 = e.touches[0].pageX
                touch.y2 = e.touches[0].pageY
                if (Math.abs(touch.x1 - touch.x2) > 10)
                    e.preventDefault()
            })
            .bind('touchend', function(e){
                cancelLongTap()

                // swipe
                if ((touch.x2 && Math.abs(touch.x1 - touch.x2) > 30) ||
                    (touch.y2 && Math.abs(touch.y1 - touch.y2) > 30))

                    swipeTimeout = setTimeout(function() {
                        touch.el.trigger('swipe')
                        touch.el.trigger('swipe' + (swipeDirection(touch.x1, touch.x2, touch.y1, touch.y2)))
                        touch = {}
                    }, 0)

                // normal tap
                else if ('last' in touch)

                // delay by one tick so we can cancel the 'tap' event if 'scroll' fires
                // ('tap' fires before 'scroll')
                    tapTimeout = setTimeout(function() {

                        // trigger universal 'tap' with the option to cancelTouch()
                        // (cancelTouch cancels processing of single vs double taps for faster 'tap' response)
                        var event = $.Event('tap')
                        event.cancelTouch = cancelAll
                        touch.el.trigger(event)

                        // trigger double tap immediately
                        if (touch.isDoubleTap) {
                            touch.el.trigger('doubleTap')
                            touch = {}
                        }

                        // trigger single tap after 250ms of inactivity
                        else {
                            touchTimeout = setTimeout(function(){
                                touchTimeout = null
                                touch.el.trigger('singleTap')
                                touch = {}
                            }, 250)
                        }

                    }, 0)

            })
            .bind('touchcancel', cancelAll)

        $(window).bind('scroll', cancelAll)
    })

    ;['swipe', 'swipeLeft', 'swipeRight', 'swipeUp', 'swipeDown', 'doubleTap', 'tap', 'singleTap', 'longTap'].forEach(function(m){
        $.fn[m] = function(callback){ return this.bind(m, callback) }
    })
})(Zepto);

/*!
 * iScroll v4.2.2 ~ Copyright (c) 2012 Matteo Spinelli, http://cubiq.org
 * Released under MIT license, http://cubiq.org/license
 */
(function(window, doc){
    var m = Math,_bindArr = [],
        dummyStyle = doc.createElement('div').style,
        vendor = (function () {
            var vendors = 'webkitT,MozT,msT,OT,t'.split(','),
                t,
                i = 0,
                l = vendors.length;

            for ( ; i < l; i++ ) {
                t = vendors[i] + 'ransform';
                if ( t in dummyStyle ) {
                    return vendors[i].substr(0, vendors[i].length - 1);
                }
            }

            return false;
        })(),
        cssVendor = vendor ? '-' + vendor.toLowerCase() + '-' : '',


    // Style properties
        transform = prefixStyle('transform'),
        transitionProperty = prefixStyle('transitionProperty'),
        transitionDuration = prefixStyle('transitionDuration'),
        transformOrigin = prefixStyle('transformOrigin'),
        transitionTimingFunction = prefixStyle('transitionTimingFunction'),
        transitionDelay = prefixStyle('transitionDelay'),

    // Browser capabilities
        isAndroid = (/android/gi).test(navigator.appVersion),
        isTouchPad = (/hp-tablet/gi).test(navigator.appVersion),

        has3d = prefixStyle('perspective') in dummyStyle,
        hasTouch = 'ontouchstart' in window && !isTouchPad,
        hasTransform = !!vendor,
        hasTransitionEnd = prefixStyle('transition') in dummyStyle,

        RESIZE_EV = 'onorientationchange' in window ? 'orientationchange' : 'resize',
        START_EV = hasTouch ? 'touchstart' : 'mousedown',
        MOVE_EV = hasTouch ? 'touchmove' : 'mousemove',
        END_EV = hasTouch ? 'touchend' : 'mouseup',
        CANCEL_EV = hasTouch ? 'touchcancel' : 'mouseup',
        TRNEND_EV = (function () {
            if ( vendor === false ) return false;

            var transitionEnd = {
                ''			: 'transitionend',
                'webkit'	: 'webkitTransitionEnd',
                'Moz'		: 'transitionend',
                'O'			: 'otransitionend',
                'ms'		: 'MSTransitionEnd'
            };

            return transitionEnd[vendor];
        })(),

        nextFrame = (function() {
            return window.requestAnimationFrame ||
                window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                window.oRequestAnimationFrame ||
                window.msRequestAnimationFrame ||
                function(callback) { return setTimeout(callback, 1); };
        })(),
        cancelFrame = (function () {
            return window.cancelRequestAnimationFrame ||
                window.webkitCancelAnimationFrame ||
                window.webkitCancelRequestAnimationFrame ||
                window.mozCancelRequestAnimationFrame ||
                window.oCancelRequestAnimationFrame ||
                window.msCancelRequestAnimationFrame ||
                clearTimeout;
        })(),

    // Helpers
        translateZ = has3d ? ' translateZ(0)' : '',

    // Constructor
        iScroll = function (el, options) {
            var that = this,
                i;

            that.wrapper = typeof el == 'object' ? el : doc.getElementById(el);
            that.wrapper.style.overflow = 'hidden';
            that.scroller = that.wrapper.children[0];

            that.translateZ = translateZ;
            // Default options
            that.options = {
                hScroll: true,
                vScroll: true,
                x: 0,
                y: 0,
                bounce: true,
                bounceLock: false,
                momentum: true,
                lockDirection: true,
                useTransform: true,
                useTransition: false,
                topOffset: 0,
                checkDOMChanges: false,		// Experimental
                handleClick: true,


                // Events
                onRefresh: null,
                onBeforeScrollStart: function (e) { e.preventDefault(); },
                onScrollStart: null,
                onBeforeScrollMove: null,
                onScrollMove: null,
                onBeforeScrollEnd: null,
                onScrollEnd: null,
                onTouchEnd: null,
                onDestroy: null

            };

            // User defined options
            for (i in options) that.options[i] = options[i];

            // Set starting position
            that.x = that.options.x;
            that.y = that.options.y;

            // Normalize options
            that.options.useTransform = hasTransform && that.options.useTransform;

            that.options.useTransition = hasTransitionEnd && that.options.useTransition;



            // Set some default styles
            that.scroller.style[transitionProperty] = that.options.useTransform ? cssVendor + 'transform' : 'top left';
            that.scroller.style[transitionDuration] = '0';
            that.scroller.style[transformOrigin] = '0 0';
            if (that.options.useTransition) that.scroller.style[transitionTimingFunction] = 'cubic-bezier(0.33,0.66,0.66,1)';

            if (that.options.useTransform) that.scroller.style[transform] = 'translate(' + that.x + 'px,' + that.y + 'px)' + translateZ;
            else that.scroller.style.cssText += ';position:absolute;top:' + that.y + 'px;left:' + that.x + 'px';



            that.refresh();

            that._bind(RESIZE_EV, window);
            that._bind(START_EV);


            if (that.options.checkDOMChanges) that.checkDOMTime = setInterval(function () {
                that._checkDOMChanges();
            }, 500);
        };

// Prototype
    iScroll.prototype = {
        enabled: true,
        x: 0,
        y: 0,
        steps: [],
        scale: 1,
        currPageX: 0, currPageY: 0,
        pagesX: [], pagesY: [],
        aniTime: null,
        isStopScrollAction:false,

        handleEvent: function (e) {
            var that = this;
            switch(e.type) {
                case START_EV:
                    if (!hasTouch && e.button !== 0) return;
                    that._start(e);
                    break;
                case MOVE_EV: that._move(e); break;
                case END_EV:
                case CANCEL_EV: that._end(e); break;
                case RESIZE_EV: that._resize(); break;
                case TRNEND_EV: that._transitionEnd(e); break;
            }
        },

        _checkDOMChanges: function () {
            if (this.moved ||  this.animating ||
                (this.scrollerW == this.scroller.offsetWidth * this.scale && this.scrollerH == this.scroller.offsetHeight * this.scale)) return;

            this.refresh();
        },

        _resize: function () {
            var that = this;
            setTimeout(function () { that.refresh(); }, isAndroid ? 200 : 0);
        },

        _pos: function (x, y) {//����λ��
            x = this.hScroll ? x : 0;
            y = this.vScroll ? y : 0;

            if (this.options.useTransform) {
                this.scroller.style[transform] = 'translate(' + x + 'px,' + y + 'px) scale(' + this.scale + ')' + translateZ;
            } else {
                x = m.round(x);
                y = m.round(y);
                this.scroller.style.left = x + 'px';
                this.scroller.style.top = y + 'px';
            }

            this.x = x;
            this.y = y;

        },



        _start: function (e) {
            var that = this,
                point = hasTouch ? e.touches[0] : e,
                matrix, x, y,
                c1, c2;

            if (!that.enabled) return;

            if (that.options.onBeforeScrollStart) that.options.onBeforeScrollStart.call(that, e);

            if (that.options.useTransition ) that._transitionTime(0);

            that.moved = false;
            that.animating = false;

            that.distX = 0;
            that.distY = 0;
            that.absDistX = 0;
            that.absDistY = 0;
            that.dirX = 0;
            that.dirY = 0;
            that.isStopScrollAction = false;

            if (that.options.momentum) {
                if (that.options.useTransform) {
                    // Very lame general purpose alternative to CSSMatrix
                    matrix = getComputedStyle(that.scroller, null)[transform].replace(/[^0-9\-.,]/g, '').split(',');
                    x = +matrix[4];
                    y = +matrix[5];
                } else {
                    x = +getComputedStyle(that.scroller, null).left.replace(/[^0-9-]/g, '');
                    y = +getComputedStyle(that.scroller, null).top.replace(/[^0-9-]/g, '');
                }

                if (m.round(x) != m.round(that.x) || m.round(y) != m.round(that.y)) {
                    that.isStopScrollAction = true;
                    if (that.options.useTransition) that._unbind(TRNEND_EV);
                    else cancelFrame(that.aniTime);
                    that.steps = [];
                    that._pos(x, y);
                    if (that.options.onScrollEnd) that.options.onScrollEnd.call(that);
                }
            }



            that.startX = that.x;
            that.startY = that.y;
            that.pointX = point.pageX;
            that.pointY = point.pageY;

            that.startTime = e.timeStamp || Date.now();

            if (that.options.onScrollStart) that.options.onScrollStart.call(that, e);

            that._bind(MOVE_EV, window);
            that._bind(END_EV, window);
            that._bind(CANCEL_EV, window);
        },

        _move: function (e) {
            var that = this,
                point = hasTouch ? e.touches[0] : e,
                deltaX = point.pageX - that.pointX,
                deltaY = point.pageY - that.pointY,
                newX = that.x + deltaX,
                newY = that.y + deltaY,

                timestamp = e.timeStamp || Date.now();

            if (that.options.onBeforeScrollMove) that.options.onBeforeScrollMove.call(that, e);

            that.pointX = point.pageX;
            that.pointY = point.pageY;

            // Slow down if outside of the boundaries
            if (newX > 0 || newX < that.maxScrollX) {
                newX = that.options.bounce ? that.x + (deltaX / 2) : newX >= 0 || that.maxScrollX >= 0 ? 0 : that.maxScrollX;
            }
            if (newY > that.minScrollY || newY < that.maxScrollY) {
                newY = that.options.bounce ? that.y + (deltaY / 2) : newY >= that.minScrollY || that.maxScrollY >= 0 ? that.minScrollY : that.maxScrollY;
            }

            that.distX += deltaX;
            that.distY += deltaY;
            that.absDistX = m.abs(that.distX);
            that.absDistY = m.abs(that.distY);

            if (that.absDistX < 6 && that.absDistY < 6) {
                return;
            }

            // Lock direction
            if (that.options.lockDirection) {
                if (that.absDistX > that.absDistY + 5) {
                    newY = that.y;
                    deltaY = 0;
                } else if (that.absDistY > that.absDistX + 5) {
                    newX = that.x;
                    deltaX = 0;
                }
            }

            that.moved = true;

            // internal for header scroll

            that._beforePos ? that._beforePos(newY, deltaY) && that._pos(newX, newY) : that._pos(newX, newY);

            that.dirX = deltaX > 0 ? -1 : deltaX < 0 ? 1 : 0;
            that.dirY = deltaY > 0 ? -1 : deltaY < 0 ? 1 : 0;

            if (timestamp - that.startTime > 300) {
                that.startTime = timestamp;
                that.startX = that.x;
                that.startY = that.y;
            }

            if (that.options.onScrollMove) that.options.onScrollMove.call(that, e);
        },

        _end: function (e) {
            if (hasTouch && e.touches.length !== 0) return;

            var that = this,
                point = hasTouch ? e.changedTouches[0] : e,
                target, ev,
                momentumX = { dist:0, time:0 },
                momentumY = { dist:0, time:0 },
                duration = (e.timeStamp || Date.now()) - that.startTime,
                newPosX = that.x,
                newPosY = that.y,
                newDuration;


            that._unbind(MOVE_EV, window);
            that._unbind(END_EV, window);
            that._unbind(CANCEL_EV, window);

            if (that.options.onBeforeScrollEnd) that.options.onBeforeScrollEnd.call(that, e);


            if (!that.moved) {

                if (hasTouch && this.options.handleClick && !that.isStopScrollAction) {
                    that.doubleTapTimer = setTimeout(function () {
                        that.doubleTapTimer = null;

                        // Find the last touched element
                        target = point.target;
                        while (target.nodeType != 1) target = target.parentNode;

                        if (target.tagName != 'SELECT' && target.tagName != 'INPUT' && target.tagName != 'TEXTAREA') {
                            ev = doc.createEvent('MouseEvents');
                            ev.initMouseEvent('click', true, true, e.view, 1,
                                point.screenX, point.screenY, point.clientX, point.clientY,
                                e.ctrlKey, e.altKey, e.shiftKey, e.metaKey,
                                0, null);
                            ev._fake = true;
                            target.dispatchEvent(ev);
                        }
                    },  0);
                }


                that._resetPos(400);

                if (that.options.onTouchEnd) that.options.onTouchEnd.call(that, e);
                return;
            }

            if (duration < 300 && that.options.momentum) {
                momentumX = newPosX ? that._momentum(newPosX - that.startX, duration, -that.x, that.scrollerW - that.wrapperW + that.x, that.options.bounce ? that.wrapperW : 0) : momentumX;
                momentumY = newPosY ? that._momentum(newPosY - that.startY, duration, -that.y, (that.maxScrollY < 0 ? that.scrollerH - that.wrapperH + that.y - that.minScrollY : 0), that.options.bounce ? that.wrapperH : 0) : momentumY;

                newPosX = that.x + momentumX.dist;
                newPosY = that.y + momentumY.dist;

                if ((that.x > 0 && newPosX > 0) || (that.x < that.maxScrollX && newPosX < that.maxScrollX)) momentumX = { dist:0, time:0 };
                if ((that.y > that.minScrollY && newPosY > that.minScrollY) || (that.y < that.maxScrollY && newPosY < that.maxScrollY)) momentumY = { dist:0, time:0 };
            }

            if (momentumX.dist || momentumY.dist) {
                newDuration = m.max(m.max(momentumX.time, momentumY.time), 10);



                that.scrollTo(m.round(newPosX), m.round(newPosY), newDuration);

                if (that.options.onTouchEnd) that.options.onTouchEnd.call(that, e);
                return;
            }



            that._resetPos(200);
            if (that.options.onTouchEnd) that.options.onTouchEnd.call(that, e);
        },

        _resetPos: function (time) {
            var that = this,
                resetX = that.x >= 0 ? 0 : that.x < that.maxScrollX ? that.maxScrollX : that.x,
                resetY = that.y >= that.minScrollY || that.maxScrollY > 0 ? that.minScrollY : that.y < that.maxScrollY ? that.maxScrollY : that.y;

            if (resetX == that.x && resetY == that.y) {
                if (that.moved) {
                    that.moved = false;
                    if (that.options.onScrollEnd) that.options.onScrollEnd.call(that);		// Execute custom code on scroll end
                    if (that._afterPos) that._afterPos();
                }

                return;
            }

            that.scrollTo(resetX, resetY, time || 0);
        },



        _transitionEnd: function (e) {
            var that = this;

            if (e.target != that.scroller) return;

            that._unbind(TRNEND_EV);

            that._startAni();
        },


        /**
         *
         * Utilities
         *
         */
        _startAni: function () {
            var that = this,
                startX = that.x, startY = that.y,
                startTime = Date.now(),
                step, easeOut,
                animate;

            if (that.animating) return;

            if (!that.steps.length) {
                that._resetPos(400);
                return;
            }

            step = that.steps.shift();

            if (step.x == startX && step.y == startY) step.time = 0;

            that.animating = true;
            that.moved = true;

            if (that.options.useTransition) {
                that._transitionTime(step.time);
                that._pos(step.x, step.y);
                that.animating = false;
                if (step.time) that._bind(TRNEND_EV);
                else that._resetPos(0);
                return;
            }

            animate = function () {
                var now = Date.now(),
                    newX, newY;

                if (now >= startTime + step.time) {
                    that._pos(step.x, step.y);
                    that.animating = false;
                    if (that.options.onAnimationEnd) that.options.onAnimationEnd.call(that);			// Execute custom code on animation end
                    that._startAni();
                    return;
                }

                now = (now - startTime) / step.time - 1;
                easeOut = m.sqrt(1 - now * now);
                newX = (step.x - startX) * easeOut + startX;
                newY = (step.y - startY) * easeOut + startY;
                that._pos(newX, newY);
                if (that.animating) that.aniTime = nextFrame(animate);
            };

            animate();
        },

        _transitionTime: function (time) {
            time += 'ms';
            this.scroller.style[transitionDuration] = time;

        },

        _momentum: function (dist, time, maxDistUpper, maxDistLower, size) {
            var deceleration = 0.0006,
                speed = m.abs(dist) * (this.options.speedScale||1) / time,
                newDist = (speed * speed) / (2 * deceleration),
                newTime = 0, outsideDist = 0;

            // Proportinally reduce speed if we are outside of the boundaries
            if (dist > 0 && newDist > maxDistUpper) {
                outsideDist = size / (6 / (newDist / speed * deceleration));
                maxDistUpper = maxDistUpper + outsideDist;
                speed = speed * maxDistUpper / newDist;
                newDist = maxDistUpper;
            } else if (dist < 0 && newDist > maxDistLower) {
                outsideDist = size / (6 / (newDist / speed * deceleration));
                maxDistLower = maxDistLower + outsideDist;
                speed = speed * maxDistLower / newDist;
                newDist = maxDistLower;
            }

            newDist = newDist * (dist < 0 ? -1 : 1);
            newTime = speed / deceleration;

            return { dist: newDist, time: m.round(newTime) };
        },

        _offset: function (el) {
            var left = -el.offsetLeft,
                top = -el.offsetTop;

            while (el = el.offsetParent) {
                left -= el.offsetLeft;
                top -= el.offsetTop;
            }

            if (el != this.wrapper) {
                left *= this.scale;
                top *= this.scale;
            }

            return { left: left, top: top };
        },



        _bind: function (type, el, bubble) {
            _bindArr.concat([el || this.scroller, type, this]);
            (el || this.scroller).addEventListener(type, this, !!bubble);
        },

        _unbind: function (type, el, bubble) {
            (el || this.scroller).removeEventListener(type, this, !!bubble);
        },


        /**
         *
         * Public methods
         *
         */
        destroy: function () {
            var that = this;

            that.scroller.style[transform] = '';



            // Remove the event listeners
            that._unbind(RESIZE_EV, window);
            that._unbind(START_EV);
            that._unbind(MOVE_EV, window);
            that._unbind(END_EV, window);
            that._unbind(CANCEL_EV, window);



            if (that.options.useTransition) that._unbind(TRNEND_EV);

            if (that.options.checkDOMChanges) clearInterval(that.checkDOMTime);

            if (that.options.onDestroy) that.options.onDestroy.call(that);

            //������а󶨵��¼�
            for (var i = 0, l = _bindArr.length; i < l;) {
                _bindArr[i].removeEventListener(_bindArr[i + 1], _bindArr[i + 2]);
                _bindArr[i] = null;
                i = i + 3
            }
            _bindArr = [];

            //�ɵ���ߵ���������
            /*var div = doc.createElement('div');
             div.appendChild(this.wrapper);
             div.innerHTML = '';
             that.wrapper = that.scroller = div = null;*/
        },

        refresh: function () {
            var that = this,
                offset;



            that.wrapperW = that.wrapper.clientWidth || 1;
            that.wrapperH = that.wrapper.clientHeight || 1;

            that.minScrollY = -that.options.topOffset || 0;
            that.scrollerW = m.round(that.scroller.offsetWidth * that.scale);
            that.scrollerH = m.round((that.scroller.offsetHeight + that.minScrollY) * that.scale);
            that.maxScrollX = that.wrapperW - that.scrollerW;
            that.maxScrollY = that.wrapperH - that.scrollerH + that.minScrollY;
            that.dirX = 0;
            that.dirY = 0;

            if (that.options.onRefresh) that.options.onRefresh.call(that);

            that.hScroll = that.options.hScroll && that.maxScrollX < 0;
            that.vScroll = that.options.vScroll && (!that.options.bounceLock && !that.hScroll || that.scrollerH > that.wrapperH);


            offset = that._offset(that.wrapper);
            that.wrapperOffsetLeft = -offset.left;
            that.wrapperOffsetTop = -offset.top;


            that.scroller.style[transitionDuration] = '0';
            that._resetPos(400);
        },

        scrollTo: function (x, y, time, relative) {
            var that = this,
                step = x,
                i, l;

            that.stop();

            if (!step.length) step = [{ x: x, y: y, time: time, relative: relative }];

            for (i=0, l=step.length; i<l; i++) {
                if (step[i].relative) { step[i].x = that.x - step[i].x; step[i].y = that.y - step[i].y; }
                that.steps.push({ x: step[i].x, y: step[i].y, time: step[i].time || 0 });
            }

            that._startAni();
        },

        scrollToElement: function (el, time) {
            var that = this, pos;
            el = el.nodeType ? el : that.scroller.querySelector(el);
            if (!el) return;

            pos = that._offset(el);
            pos.left += that.wrapperOffsetLeft;
            pos.top += that.wrapperOffsetTop;

            pos.left = pos.left > 0 ? 0 : pos.left < that.maxScrollX ? that.maxScrollX : pos.left;
            pos.top = pos.top > that.minScrollY ? that.minScrollY : pos.top < that.maxScrollY ? that.maxScrollY : pos.top;
            time = time === undefined ? m.max(m.abs(pos.left)*2, m.abs(pos.top)*2) : time;

            that.scrollTo(pos.left, pos.top, time);
        },

        scrollToPage: function (pageX, pageY, time) {
            var that = this, x, y;

            time = time === undefined ? 400 : time;

            if (that.options.onScrollStart) that.options.onScrollStart.call(that);


            x = -that.wrapperW * pageX;
            y = -that.wrapperH * pageY;
            if (x < that.maxScrollX) x = that.maxScrollX;
            if (y < that.maxScrollY) y = that.maxScrollY;


            that.scrollTo(x, y, time);
        },

        disable: function () {
            this.stop();
            this._resetPos(0);
            this.enabled = false;

            // If disabled after touchstart we make sure that there are no left over events
            this._unbind(MOVE_EV, window);
            this._unbind(END_EV, window);
            this._unbind(CANCEL_EV, window);
        },

        enable: function () {
            this.enabled = true;
        },

        stop: function () {
            if (this.options.useTransition) this._unbind(TRNEND_EV);
            else cancelFrame(this.aniTime);
            this.steps = [];
            this.moved = false;
            this.animating = false;
        },

        isReady: function () {
            return !this.moved &&  !this.animating;
        }
    };

    function prefixStyle (style) {
        if ( vendor === '' ) return style;

        style = style.charAt(0).toUpperCase() + style.substr(1);
        return vendor + style;
    }

    dummyStyle = null;	// for the sake of it

    if (typeof exports !== 'undefined') exports.iScroll = iScroll;
    else window.iScroll = iScroll;

    // ��$.fn�Ϲ�iScroll����
    (function( $, ns, undefined ){
        if(!$)return;

        var _iScroll = ns.iScroll,

            slice = [].slice,

            record = (function() {
                var data = {},
                    id = 0,
                    ikey = '_sid';    // internal key.

                return function( obj, val ) {
                    var key = obj[ ikey ] || (obj[ ikey ] = ++id);

                    val !== undefined && (data[ key ] = val);
                    val === null && delete data[ key ];

                    return data[ key ];
                };
            })(),

            iScroll;

        ns.iScroll = iScroll = function( el, options ){
            var args = [].slice.call( arguments, 0 ),
                ins = new _iScroll( el, options );

            record( el, ins );
            return ins;
        };
        iScroll.prototype = _iScroll.prototype;


        $.fn.iScroll = function( opts ) {
            var args = slice.call( arguments, 1 ),
                method = typeof opts === 'string' && opts,
                ret,
                obj;

            $.each( this, function( i, el ) {

                // �ӻ�����ȡ��û���򴴽�һ��
                obj = record( el ) || iScroll( el, $.isPlainObject( opts ) ?
                    opts : undefined );

                // ȡʵ��
                if ( method === 'this' ) {
                    ret = obj;
                    return false;    // �Ͽ�eachѭ��
                } else if ( method ) {

                    // ��ȡ�ķ���������ʱ���׳�������Ϣ
                    if ( !$.isFunction( obj[ method ] ) ) {
                        throw new Error( 'iScrollû�д˷�����' + method );
                    }

                    ret = obj[ method ].apply( obj, args );

                    // �϶�����getter���ʵķ�����������Ҫ�Ͽ�eachѭ�����ѽ������
                    if ( ret !== undefined && ret !== obj ) {
                        return false;
                    }

                    // retΪobjʱΪ��Чֵ��Ϊ�˲�Ӱ�����ķ���
                    ret = undefined;
                }
            } );

            return ret !== undefined ? ret : this;
        };

    })( window.Zepto || null, window );
})(window, document);
/**
 * Change list
 * �޸ļ�¼
 *
 * 1. 2012-08-14 ��������а�סֹͣ�������ɿ��󱻵�Ԫ�ش�������¼���
 *
 * �����޸�:
 * a. 202�� ���isStopScrollAction: false ��iScroll��ԭ������ӱ���
 * b. 365�� _start�����������that.isStopScrollAction = false; Ĭ�������ֵΪfalse
 * c. 390�� if (x != that.x || y != that.y)����������� �����  that.isStopScrollAction = true; ��Ŀ��ֵ��ʵ��ֵ��һ�£�˵�����ڹ���������
 * d. 554�� that.isStopScrollAction || (that.doubleTapTimer = setTimeout(function () {
 *          ......
 *          ......
 *          }, that.options.zoom ? 250 : 0));
 *   ���isStopScrollActionΪtrue�Ͳ�����click�¼�
 *
 *
 * 2. 2012-08-14 ��options�������speedScale���ԣ��ṩ�ⲿ���Ƴ��������ٶ�
 *
 * �����޸�
 * a. 108�� ���speedScale: 1, ��options�������speedScale���ԣ�Ĭ��Ϊ1
 * b. 798�� speed = m.abs(dist) * this.options.speedScale / time, ��ԭ���ٶȵĻ�����*speedScale���ı��ٶ�
 *
 * 3. 2012-08-21 �޸Ĳ��ִ��룬��iscroll_pluginǽ�õ�
 *
 * �����޸�
 * a. 517��  ��_pos֮ǰ������_beforePos,������治����true,  ���������_pos
 *  // internal for header scroll
 *  if (that._beforePos)
 *      that._beforePos(newY, deltaY) && that._pos(newX, newY);
 *  else
 *      that._pos(newX, newY);
 *
 * b. 680�� �ڹ������������ _afterPos.
 * // internal for header scroll
 * if (that._afterPos) that._afterPos();
 *
 * c. 106�й���������������´���
 * // add var to this for header scroll
 * that.translateZ = translateZ;
 *
 * Ϊ�������
 * _bind ����
 * destroy ����
 * �ͷ�� _bindArr = []
 *
 */
/**
 * @file GMU���ư�iscroll������[iScroll 4.2.2](http://cubiq.org/iscroll-4), ȥ��zoom, pc���ݣ�snap, scrollbar�ȹ��ܡ�ͬʱ��iscroll��չ����Zepto��ԭ���С�
 * @name iScroll
 * @import zepto.js
 * @desc GMU���ư�iscroll������{@link[http://cubiq.org/iscroll-4] iScroll 4.2.2}, ȥ��zoom, pc���ݣ�snap, scrollbar�ȹ��ܡ�ͬʱ��iscroll��չ����***Zepto***��ԭ���С�
 */

/**
 * @name iScroll
 * @grammar new iScroll(el,[options])  => self
 * @grammar $('selecotr').iScroll([options])  => zeptoʵ��
 * @desc ��iScroll���뵽��***$.fn***�У�������Zepto�ķ�ʽ����iScroll��
 * **el**
 * - ***el {String/ElementNode}*** iscroll�����ڵ�
 *
 * **Options**
 * - ***hScroll*** {Boolean}: (��ѡ, Ĭ��: true)�����Ƿ���Թ���
 * - ***vScroll*** {Boolean}: (��ѡ, Ĭ��: true)�����Ƿ���Թ���
 * - ***momentum*** {Boolean}: (��ѡ, Ĭ��: true)�Ƿ���й���Ч��
 * - ***checkDOMChanges*** {Boolean, Ĭ��: false}: (��ѡ)ÿ��500�����ж�һ�¹�������������Ƿ�����׷�ӵ����ݣ�����о͵���refresh������Ⱦһ��
 * - ***useTransition*** {Boolean, Ĭ��: false}: (��ѡ)�Ƿ�ʹ��css3����ʵ�ֶ�����Ĭ����false,���鿪��
 * - ***topOffset*** {Number}: (��ѡ, Ĭ��: 0)�ɹ�������ͷ���������ٸ߶ȣ�Ĭ����0�� ***��Ҫ����ͷ���������ظ���ʱ������ͷ������ʾ��ť***
 * @example
 * $('div').iscroll().find('selector').atrr({'name':'aaa'}) //������ʽ����
 * $('div').iScroll('refresh');//����iScroll�ķ���
 * $('div').iScroll('scrollTo', 0, 0, 200);//����iScroll�ķ���, 200ms�ڹ���������
 */


/**
 * @name destroy
 * @desc ����iScrollʵ������ԭiScroll��destroy�Ļ����϶Դ�����domԪ�ؽ���������
 * @grammar destroy()  => undefined
 */

/**
 * @name refresh
 * @desc ����iScrollʵ�����ڹ�������������ʱ�����߿ɹ����������仯ʱ��Ҫ����***refresh***������������
 * @grammar refresh()  => undefined
 */

/**
 * @name scrollTo
 * @desc ʹiScrollʵ������ָ��ʱ���ڹ�����ָ����λ�ã� ���relativeΪtrue, ˵��x, y��ֵ������뵱ǰλ�õġ�
 * @grammar scrollTo(x, y, time, relative)  => undefined
 */
/**
 * @name scrollToElement
 * @desc ������ָ���ڲ�Ԫ��
 * @grammar scrollToElement(element, time)  => undefined
 * @grammar scrollToElement(selector, time)  => undefined
 */
/**
 * @name scrollToPage
 * @desc ��scrollTo�������ﴫ����ǰٷֱȡ�
 * @grammar scrollToPage(pageX, pageY, time)  => undefined
 */
/**
 * @name disable
 * @desc ����iScroll
 * @grammar disable()  => undefined
 */
/**
 * @name enable
 * @desc ����iScroll
 * @grammar enable()  => undefined
 */
/**
 * @name stop
 * @desc ����iscroll����
 * @grammar stop()  => undefined
 */

/**
 * @file ý���ѯ
 * @import zepto.js
 * @module GMU
 */

(function ($) {

    /**
     * ��ԭ����window.matchMedia������polyfill�����ڲ�֧��matchMedia�ķ���ϵͳ�������������[w3c window.matchMedia](http://www.w3.org/TR/cssom-view/#dom-window-matchmedia)�Ľӿ�
     * ���壬��matchMedia���������˷�װ��ԭ������css media query��transitionEnd�¼�����ɵġ���ҳ���в���media query��ʽ��Ԫ�أ���query��������ʱ�ı��Ԫ����ʽ��ͬʱ�����ʽ��transition���õ����ԣ�
     * ���������󼴻ᴥ��transitionEnd���ɴ˴���MediaQueryList���¼�����������transition��duration timeΪ0.001ms������ֱ��ʹ��MediaQueryList�����matchesȥ�жϵ�ǰ�Ƿ���queryƥ�䣬���в����ӳ٣�
     * ����ע��addListener�ķ�ʽȥ����query�ĸı䡣$.matchMedia����ϸʵ��ԭ�����ø÷���ʵ�ֵ�ת��ͳһ����������
     * [GMU Pages: ת���������($.matchMedia)](https://github.com/gmuteam/GMU/wiki/%E8%BD%AC%E5%B1%8F%E8%A7%A3%E5%86%B3%E6%96%B9%E6%A1%88$.matchMedia)
     *
     * ����ֵMediaQueryList�������������<br />
     * - ***matches*** �Ƿ�����query<br />
     * - ***query*** ��ѯ��css query������\'screen and (orientation: portrait)\'<br />
     * - ***addListener*** ���MediaQueryList��������������ջص��������ص�����ΪMediaQueryList����<br />
     * - ***removeListener*** �Ƴ�MediaQueryList���������<br />
     *
     *
     * @method $.matchMedia
     * @grammar $.matchMedia(query)  ? MediaQueryList
     * @param {String} query ��ѯ��css query������\'screen and (orientation: portrait)\'
     * @return {Object} MediaQueryList
     * @example
     * $.matchMedia('screen and (orientation: portrait)').addListener(fn);
     */
    $.matchMedia = (function() {
        var mediaId = 0,
            cls = 'gmu-media-detect',
            transitionEnd = $.fx.transitionEnd,
            cssPrefix = $.fx.cssPrefix,
            $style = $('<style></style>').append('.' + cls + '{' + cssPrefix + 'transition: width 0.001ms; width: 0; position: absolute; clip: rect(1px, 1px, 1px, 1px);}\n').appendTo('head');

        return function (query) {
            var id = cls + mediaId++,
                $mediaElem,
                listeners = [],
                ret;

            $style.append('@media ' + query + ' { #' + id + ' { width: 1px; } }\n') ;   //ԭ��matchMediaҲ��Ҫ��Ӷ�Ӧ��@media������Ч

            // ͳһ��ģ��ģ�ʱ�����á�
            // if ('matchMedia' in window) {
            //     return window.matchMedia(query);
            // }

            $mediaElem = $('<div class="' + cls + '" id="' + id + '"></div>')
                .appendTo('body')
                .on(transitionEnd, function() {
                    ret.matches = $mediaElem.width() === 1;
                    $.each(listeners, function (i,fn) {
                        $.isFunction(fn) && fn.call(ret, ret);
                    });
                });

            ret = {
                matches: $mediaElem.width() === 1 ,
                media: query,
                addListener: function (callback) {
                    listeners.push(callback);
                    return this;
                },
                removeListener: function (callback) {
                    var index = listeners.indexOf(callback);
                    ~index && listeners.splice(index, 1);
                    return this;
                }
            };

            return ret;
        };
    }());
})(Zepto);

/**
 * @file ��չת���¼�
 * @name ortchange
 * @short ortchange
 * @desc ��չת���¼�orientation�����ԭ��ת���¼��ļ���������
 * @import zepto.js, extend/matchMedia.js
 */

$(function () {
    /**
     * @name ortchange
     * @desc ��չת���¼�orientation�����ԭ��ת���¼��ļ���������
     * - ***ortchange*** : ��ת����ʱ�򴥷�������uc��������֧��orientationchange���豸������css media queryʵ�֣������ת����ʱ��orientation�¼��ļ���������
     * $(window).on('ortchange', function () {        //��ת����ʱ�򴥷�
     *     console.log('ortchange');
     * });
     */
        //��չ����media query
    $.mediaQuery = {
        ortchange: 'screen and (width: ' + window.innerWidth + 'px)'
    };
    //ͨ��matchMedia����ת���¼�
    $.matchMedia($.mediaQuery.ortchange).addListener(function () {
        $(window).trigger('ortchange');
    });
});

/**
 *  @file ʵ����ͨ��highlight������
 *  @name Highlight
 *  @desc �������Ч��
 *  @import zepto.js
 */
(function( $ ) {
    var $doc = $( document ),
        $el,    // ��ǰ���µ�Ԫ��
        timer;    // ���ǵ���������ʱ���ܸ����������õ���100ms��ʱ

    // �����Ƴ�className.
    function dismiss() {
        var cls = $el.attr( 'hl-cls' );

        clearTimeout( timer );
        $el.removeClass( cls ).removeAttr( 'hl-cls' );
        $el = null;
        $doc.off( 'touchend touchmove touchcancel', dismiss );
    }

    /**
     * @name highlight
     * @desc ���õ�ϵͳ�ĸ���������ָ�ƶ���Ԫ����ʱ���ָ��class����ָ�ƿ�ʱ���Ƴ���class.
     * ��������className�ǣ��˲���������¼��󶨡�
     *
     * �˷���֧�ִ���selector, �˷�ʽ���õ��¼���������dom����ء�
     * @grammar  highlight(className, selector )   => self
     * @grammar  highlight(className )   => self
     * @grammar  highlight()   => self
     * @example var div = $('div');
     * div.highlight('div-hover');
     *
     * $('a').highlight();// ������a���Դ��ĸ���Ч��ȥ����
     */
    $.fn.highlight = function( className, selector ) {
        return this.each(function() {
            var $this = $( this );

            $this.css( '-webkit-tap-highlight-color', 'rgba(255,255,255,0)' )
                .off( 'touchstart.hl' );

            className && $this.on( 'touchstart.hl', function( e ) {
                var match;

                $el = selector ? (match = $( e.target ).closest( selector,
                    this )) && match.length && match : $this;

                // selctor�����Ҳ���Ԫ�ء�
                if ( $el ) {
                    $el.attr( 'hl-cls', className );
                    timer = setTimeout( function() {
                        $el.addClass( className );
                    }, 100 );
                    $doc.on( 'touchend touchmove touchcancel', dismiss );
                }
            } );
        });
    };
})( Zepto );

/**
 * @file ģ�����
 * @import zepto.js
 * @module GMU
 */
(function( $, undefined ) {

    /**
     * ����ģ��tpl����dataδ����ʱ���ر�������������ĳ��template��Ҫ��ν���ʱ�����鱣�������������Ȼ����ô˺������õ������
     *
     * @method $.parseTpl
     * @grammar $.parseTpl(str, data)  => string
     * @grammar $.parseTpl(str)  => Function
     * @param {String} str ģ��
     * @param {Object} data ����
     * @example var str = "<p><%=name%></p>",
     * obj = {name: 'ajean'};
     * console.log($.parseTpl(str, data)); // => <p>ajean</p>
     */
    $.parseTpl = function( str, data ) {
        var tmpl = 'var __p=[];' + 'with(obj||{}){__p.push(\'' +
                str.replace( /\\/g, '\\\\' )
                    .replace( /'/g, '\\\'' )
                    .replace( /<%=([\s\S]+?)%>/g, function( match, code ) {
                        return '\',' + code.replace( /\\'/, '\'' ) + ',\'';
                    } )
                    .replace( /<%([\s\S]+?)%>/g, function( match, code ) {
                        return '\');' + code.replace( /\\'/, '\'' )
                            .replace( /[\r\n\t]/g, ' ' ) + '__p.push(\'';
                    } )
                    .replace( /\r/g, '\\r' )
                    .replace( /\n/g, '\\n' )
                    .replace( /\t/g, '\\t' ) +
                '\');}return __p.join("");',

        /* jsbint evil:true */
            func = new Function( 'obj', tmpl );

        return data ? func( data ) : func;
    };
})( Zepto );

// Copyright (c) 2013, Baidu Inc. All rights reserved.
//
// Licensed under the BSD License
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://gmu.baidu.com/license.html
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @file ����gmu�����ռ�
 * @namespace gmu
 * @import zepto.js
 */

/**
 * GMU�ǻ���zepto��������mobile UI����⣬����jquery uiʹ�ù淶���ṩwebapp��pad�˼����õ�UI�����Ϊ�˼�С��������������ܣ�����ٲ����������iOS3+ / android2.1+��֧�ֹ��������ƶ������������safari, chrome, UC, qq�ȡ�
 * GMU�ɰٶ�GMUС�鿪�������ڿ�ԴBSDЭ�飬֧����ҵ�ͷ���ҵ�û������ʹ�ú������޸ģ�������ͨ��[get started](http://gmu.baidu.com/getstarted)�����˽⡣
 *
 * ###Quick Start###
 * + **������**http://gmu.baidu.com/
 * + **API��**http://gmu.baidu.com/doc
 *
 * ###��ʷ�汾###
 *
 * ### 2.0.5 ###
 * + **DEMO: ** http://gmu.baidu.com/demo/2.0.5
 * + **API��** http://gmu.baidu.com/doc/2.0.5
 * + **���أ�** http://gmu.baidu.com/download/2.0.5
 *
 * @module GMU
 * @title GMU API �ĵ�
 */
var gmu = gmu || {
    version: '@version',
    $: window.Zepto,

    /**
     * ���ô˷��������Լ�С�ظ�ʵ����Zepto�Ŀ���������ͨ���˷������õģ���������һ��Zeptoʵ����
     * ��������Zeptoʵ�������Ŀ��������ô˷�����
     * @method staticCall
     * @grammar gmu.staticCall( dom, fnName, args... )
     * @param  {DOM} elem Dom����
     * @param  {String} fn Zepto��������
     * @param {*} * zepto�ж�Ӧ�ķ���������
     * @example
     * // ����dom��className��dom2, ���õ���zepto�ķ���������ֻ��ʵ����һ��Zepto�ࡣ
     * var dom = document.getElementById( '#test' );
     *
     * var className = gmu.staticCall( dom, 'attr', 'class' );
     * console.log( className );
     *
     * var dom2 = document.getElementById( '#test2' );
     * gmu.staticCall( dom, 'addClass', className );
     */
    staticCall: (function( $ ) {
        var proto = $.fn,
            slice = [].slice,

        // ���ô�zeptoʵ��
            instance = $();

        instance.length = 1;

        return function( item, fn ) {
            instance[ 0 ] = item;
            return proto[ fn ].apply( instance, slice.call( arguments, 2 ) );
        };
    })( Zepto )
};

/**
 * @file Event���, ��widget�ṩ�¼���Ϊ��Ҳ���Ը����������ṩ�¼���Ϊ��
 * @import core/gmu.js
 * @module GMU
 */
(function( gmu, $ ) {
    var slice = [].slice,
        separator = /\s+/,

        returnFalse = function() {
            return false;
        },

        returnTrue = function() {
            return true;
        };

    function eachEvent( events, callback, iterator ) {

        // ��֧�ֶ���ֻ֧�ֶ��event�ÿո����
        (events || '').split( separator ).forEach(function( type ) {
            iterator( type, callback );
        });
    }

    // ����ƥ��namespace����
    function matcherFor( ns ) {
        return new RegExp( '(?:^| )' + ns.replace( ' ', ' .* ?' ) + '(?: |$)' );
    }

    // ����event name��event namespace
    function parse( name ) {
        var parts = ('' + name).split( '.' );

        return {
            e: parts[ 0 ],
            ns: parts.slice( 1 ).sort().join( ' ' )
        };
    }

    function findHandlers( arr, name, callback, context ) {
        var matcher,
            obj;

        obj = parse( name );
        obj.ns && (matcher = matcherFor( obj.ns ));
        return arr.filter(function( handler ) {
            return handler &&
                (!obj.e || handler.e === obj.e) &&
                (!obj.ns || matcher.test( handler.ns )) &&
                (!callback || handler.cb === callback ||
                    handler.cb._cb === callback) &&
                (!context || handler.ctx === context);
        });
    }

    /**
     * Event�࣬���gmu.eventһ��ʹ��, ����ʹ�κζ�������¼���Ϊ����������`preventDefault()`, `stopPropagation()`������
     * ���ǵ����¼�û��Domð�ݸ������û��`stopImmediatePropagation()`��������`stopProgapation()`�����þ���
     * ��֮���handler����ִ�С�
     *
     * @class Event
     * @constructor
     * ```javascript
     * var obj = {};
     *
     * $.extend( obj, gmu.event );
     *
     * var etv = gmu.Event( 'beforeshow' );
     * obj.trigger( etv );
     *
     * if ( etv.isDefaultPrevented() ) {
     *     console.log( 'before show has been prevented!' );
     * }
     * ```
     * @grammar new gmu.Event( name[, props]) => instance
     * @param {String} type �¼�����
     * @param {Object} [props] ���Զ��󣬽������ƽ�event����
     */
    function Event( type, props ) {
        if ( !(this instanceof Event) ) {
            return new Event( type, props );
        }

        props && $.extend( this, props );
        this.type = type;

        return this;
    }

    Event.prototype = {

        /**
         * @method isDefaultPrevented
         * @grammar e.isDefaultPrevented() => Boolean
         * @desc �жϴ��¼��Ƿ���ֹ
         */
        isDefaultPrevented: returnFalse,

        /**
         * @method isPropagationStopped
         * @grammar e.isPropagationStopped() => Boolean
         * @desc �жϴ��¼��Ƿ�ֹͣ����
         */
        isPropagationStopped: returnFalse,

        /**
         * @method preventDefault
         * @grammar e.preventDefault() => undefined
         * @desc ��ֹ�¼�Ĭ����Ϊ
         */
        preventDefault: function() {
            this.isDefaultPrevented = returnTrue;
        },

        /**
         * @method stopPropagation
         * @grammar e.stopPropagation() => undefined
         * @desc ��ֹ�¼�����
         */
        stopPropagation: function() {
            this.isPropagationStopped = returnTrue;
        }
    };

    /**
     * @class event
     * @static
     * @description event���󣬰���һ��event�������������Խ��˶������ŵ���������������¼���Ϊ��
     *
     * ```javascript
     * var myobj = {};
     *
     * $.extend( myobj, gmu.event );
     *
     * myobj.on( 'eventname', function( e, var1, var2, var3 ) {
     *     console.log( 'event handler' );
     *     console.log( var1, var2, var3 );    // =>1 2 3
     * } );
     *
     * myobj.trigger( 'eventname', 1, 2, 3 );
     * ```
     */
    gmu.event = {

        /**
         * ���¼���
         * @method on
         * @grammar on( name, fn[, context] ) => self
         * @param  {String}   name     �¼���
         * @param  {Function} callback �¼�������
         * @param  {Object}   context  �¼��������������ġ�
         * @return {self} ��������������ʽ
         * @chainable
         */
        on: function( name, callback, context ) {
            var me = this,
                set;

            if ( !callback ) {
                return this;
            }

            set = this._events || (this._events = []);

            eachEvent( name, callback, function( name, callback ) {
                var handler = parse( name );

                handler.cb = callback;
                handler.ctx = context;
                handler.ctx2 = context || me;
                handler.id = set.length;
                set.push( handler );
            } );

            return this;
        },

        /**
         * ���¼����ҵ�handlerִ������Զ�����󶨡�
         * @method one
         * @grammar one( name, fn[, context] ) => self
         * @param  {String}   name     �¼���
         * @param  {Function} callback �¼�������
         * @param  {Object}   context  �¼��������������ġ�
         * @return {self} ��������������ʽ
         * @chainable
         */
        one: function( name, callback, context ) {
            var me = this;

            if ( !callback ) {
                return this;
            }

            eachEvent( name, callback, function( name, callback ) {
                var once = function() {
                    me.off( name, once );
                    return callback.apply( context || me, arguments );
                };

                once._cb = callback;
                me.on( name, once, context );
            } );

            return this;
        },

        /**
         * ����¼���
         * @method off
         * @grammar off( name[, fn[, context] ] ) => self
         * @param  {String}   name     �¼���
         * @param  {Function} callback �¼�������
         * @param  {Object}   context  �¼��������������ġ�
         * @return {self} ��������������ʽ
         * @chainable
         */
        off: function( name, callback, context ) {
            var events = this._events;

            if ( !events ) {
                return this;
            }

            if ( !name && !callback && !context ) {
                this._events = [];
                return this;
            }

            eachEvent( name, callback, function( name, callback ) {
                findHandlers( events, name, callback, context )
                    .forEach(function( handler ) {
                        delete events[ handler.id ];
                    });
            } );

            return this;
        },

        /**
         * �����¼�
         * @method trigger
         * @grammar trigger( name[, ...] ) => self
         * @param  {String | Event }   evt     �¼�����gmu.Event����ʵ��
         * @param  {*} * �������
         * @return {self} ��������������ʽ
         * @chainable
         */
        trigger: function( evt ) {
            var i = -1,
                args,
                events,
                stoped,
                len,
                ev;

            if ( !this._events || !evt ) {
                return this;
            }

            typeof evt === 'string' && (evt = new Event( evt ));

            args = slice.call( arguments, 1 );
            evt.args = args;    // handler�п���ֱ��ͨ��e.args��ȡtrigger����
            args.unshift( evt );

            events = findHandlers( this._events, evt.type );

            if ( events ) {
                len = events.length;

                while ( ++i < len ) {
                    if ( (stoped = evt.isPropagationStopped()) ||  false ===
                        (ev = events[ i ]).cb.apply( ev.ctx2, args )
                        ) {

                        // ���return false���൱��stopPropagation()��preventDefault();
                        stoped || (evt.stopPropagation(), evt.preventDefault());
                        break;
                    }
                }
            }

            return this;
        }
    };

    // expose
    gmu.Event = Event;
})( gmu, gmu.$ );

/**
 * @file gmu�ײ㣬�����˴���gmu����ķ���
 * @import core/gmu.js, core/event.js, extend/parseTpl.js
 * @module GMU
 */

(function( gmu, $, undefined ) {
    var slice = [].slice,
        toString = Object.prototype.toString,
        blankFn = function() {},

    // �ҵ�������ϵ����ԡ�����
        staticlist = [ 'options', 'template', 'tpl2html' ],

    // �洢�Ͷ�ȡ���ݵ�ָ�������κζ������dom����
    // ע�⣺���ݲ�ֱ�Ӵ洢��object�ϣ����Ǵ����ڲ��հ��У�ͨ��_gid����
    // record( object, key ) ��ȡobject��Ӧ��keyֵ
    // record( object, key, value ) ����object��Ӧ��keyֵ
    // record( object, key, null ) ɾ������
        record = (function() {
            var data = {},
                id = 0,
                ikey = '_gid';    // internal key.

            return function( obj, key, val ) {
                var dkey = obj[ ikey ] || (obj[ ikey ] = ++id),
                    store = data[ dkey ] || (data[ dkey ] = {});

                val !== undefined && (store[ key ] = val);
                val === null && delete store[ key ];

                return store[ key ];
            };
        })(),

        event = gmu.event;

    function isPlainObject( obj ) {
        return toString.call( obj ) === '[object Object]';
    }

    // ��������
    function eachObject( obj, iterator ) {
        obj && Object.keys( obj ).forEach(function( key ) {
            iterator( key, obj[ key ] );
        });
    }

    // ��ĳ��Ԫ���϶�ȡĳ�����ԡ�
    function parseData( data ) {
        try {    // JSON.parse���ܱ���

            // ��data===null��ʾ��û�д�����
            data = data === 'true' ? true :
                    data === 'false' ? false : data === 'null' ? null :

                // ������������ͣ����ַ�������ת����������
                    +data + '' === data ? +data :
                /(?:\{[\s\S]*\}|\[[\s\S]*\])$/.test( data ) ?
                    JSON.parse( data ) : data;
        } catch ( ex ) {
            data = undefined;
        }

        return data;
    }

    // ��DOM�ڵ��ϻ�ȡ������
    function getDomOptions( el ) {
        var ret = {},
            attrs = el && el.attributes,
            len = attrs && attrs.length,
            key,
            data;

        while ( len-- ) {
            data = attrs[ len ];
            key = data.name;

            if ( key.substring(0, 5) !== 'data-' ) {
                continue;
            }

            key = key.substring( 5 );
            data = parseData( data.value );

            data === undefined || (ret[ key ] = data);
        }

        return ret;
    }

    // ��$.fn�ϹҶ�Ӧ�����������
    // $('#btn').button( options );ʵ�������
    // $('#btn').button( 'select' ); ����ʵ������
    // $('#btn').button( 'this' ); ȡ���ʵ��
    // �˷�����ѭget first set allԭ��
    function zeptolize( name ) {
        var key = name.substring( 0, 1 ).toLowerCase() + name.substring( 1 ),
            old = $.fn[ key ];

        $.fn[ key ] = function( opts ) {
            var args = slice.call( arguments, 1 ),
                method = typeof opts === 'string' && opts,
                ret,
                obj;

            $.each( this, function( i, el ) {

                // �ӻ�����ȡ��û���򴴽�һ��
                obj = record( el, name ) || new gmu[ name ]( el,
                    isPlainObject( opts ) ? opts : undefined );

                // ȡʵ��
                if ( method === 'this' ) {
                    ret = obj;
                    return false;    // �Ͽ�eachѭ��
                } else if ( method ) {

                    // ��ȡ�ķ���������ʱ���׳�������Ϣ
                    if ( !$.isFunction( obj[ method ] ) ) {
                        throw new Error( '���û�д˷�����' + method );
                    }

                    ret = obj[ method ].apply( obj, args );

                    // �϶�����getter���ʵķ�����������Ҫ�Ͽ�eachѭ�����ѽ������
                    if ( ret !== undefined && ret !== obj ) {
                        return false;
                    }

                    // retΪobjʱΪ��Чֵ��Ϊ�˲�Ӱ�����ķ���
                    ret = undefined;
                }
            } );

            return ret !== undefined ? ret : this;
        };

        /*
         * NO CONFLICT
         * var gmuPanel = $.fn.panel.noConflict();
         * gmuPanel.call(test, 'fnname');
         */
        $.fn[ key ].noConflict = function() {
            $.fn[ key ] = old;
            return this;
        };
    }

    // ����ע���option
    function loadOption( klass, opts ) {
        var me = this;

        // �ȼ��ظ�����
        if ( klass.superClass ) {
            loadOption.call( me, klass.superClass, opts );
        }

        eachObject( record( klass, 'options' ), function( key, option ) {
            option.forEach(function( item ) {
                var condition = item[ 0 ],
                    fn = item[ 1 ];

                if ( condition === '*' ||
                    ($.isFunction( condition ) &&
                        condition.call( me, opts[ key ] )) ||
                    condition === opts[ key ] ) {

                    fn.call( me );
                }
            });
        } );
    }

    // ����ע��Ĳ��
    function loadPlugins( klass, opts ) {
        var me = this;

        // �ȼ��ظ�����
        if ( klass.superClass ) {
            loadPlugins.call( me, klass.superClass, opts );
        }

        eachObject( record( klass, 'plugins' ), function( opt, plugin ) {

            // ���������ر��ˣ������ô˲��
            if ( opts[ opt ] === false ) {
                return;
            }

            eachObject( plugin, function( key, val ) {
                var oringFn;

                if ( $.isFunction( val ) && (oringFn = me[ key ]) ) {
                    me[ key ] = function() {
                        var origin = me.origin,
                            ret;

                        me.origin = oringFn;
                        ret = val.apply( me, arguments );
                        origin === undefined ? delete me.origin :
                            (me.origin = origin);

                        return ret;
                    };
                } else {
                    me[ key ] = val;
                }
            } );

            plugin._init.call( me );
        } );
    }

    // �ϲ�����
    function mergeObj() {
        var args = slice.call( arguments ),
            i = args.length,
            last;

        while ( i-- ) {
            last = last || args[ i ];
            isPlainObject( args[ i ] ) || args.splice( i, 1 );
        }

        return args.length ?
            $.extend.apply( null, [ true, {} ].concat( args ) ) : last; // �����options��ĳ��Ϊobjectʱ�������в�����==�ж�
    }

    // ��ʼ��widget. ���ؾ���ϸ�ڣ���Ϊ������ڹ������еĻ����ǿ��Կ������������ݵ�
    // ͬʱ�˷������Թ��á�
    function bootstrap( name, klass, uid, el, options ) {
        var me = this,
            opts;

        if ( isPlainObject( el ) ) {
            options = el;
            el = undefined;
        }

        // options�д���elʱ������el
        options && options.el && (el = $( options.el ));
        el && (me.$el = $( el ), el = me.$el[ 0 ]);

        opts = me._options = mergeObj( klass.options,
            getDomOptions( el ), options );

        me.template = mergeObj( klass.template, opts.template );

        me.tpl2html = mergeObj( klass.tpl2html, opts.tpl2html );

        // ����eventNs widgetName
        me.widgetName = name.toLowerCase();
        me.eventNs = '.' + me.widgetName + uid;

        me._init( opts );

        // ����setup������ֻ�д����$el��DOM�У�����Ϊ��setupģʽ
        me._options.setup = (me.$el && me.$el.parent()[ 0 ]) ? true: false;

        loadOption.call( me, klass, opts );
        loadPlugins.call( me, klass, opts );

        // ���д���DOM�Ȳ���
        me._create();
        me.trigger( 'ready' );

        el && record( el, name, me ) && me.on( 'destroy', function() {
            record( el, name, null );
        } );

        return me;
    }

    /**
     * @desc ����һ���࣬���캯��Ĭ��Ϊinit����, superClassĬ��ΪBase
     * @name createClass
     * @grammar createClass(object[, superClass]) => fn
     */
    function createClass( name, object, superClass ) {
        if ( typeof superClass !== 'function' ) {
            superClass = gmu.Base;
        }

        var uuid = 1,
            suid = 1;

        function klass( el, options ) {
            if ( name === 'Base' ) {
                throw new Error( 'Base�಻��ֱ��ʵ����' );
            }

            if ( !(this instanceof klass) ) {
                return new klass( el, options );
            }

            return bootstrap.call( this, name, klass, uuid++, el, options );
        }

        $.extend( klass, {

            /**
             * @name register
             * @grammar klass.register({})
             * @desc ע����
             */
            register: function( name, obj ) {
                var plugins = record( klass, 'plugins' ) ||
                    record( klass, 'plugins', {} );

                obj._init = obj._init || blankFn;

                plugins[ name ] = obj;
                return klass;
            },

            /**
             * @name option
             * @grammar klass.option(option, value, method)
             * @desc ���������������
             */
            option: function( option, value, method ) {
                var options = record( klass, 'options' ) ||
                    record( klass, 'options', {} );

                options[ option ] || (options[ option ] = []);
                options[ option ].push([ value, method ]);

                return klass;
            },

            /**
             * @name inherits
             * @grammar klass.inherits({})
             * @desc �Ӹ���̳г�һ�����࣬���ᱻ�ҵ�gmu�����ռ�
             */
            inherits: function( obj ) {

                // ���� Sub class
                return createClass( name + 'Sub' + suid++, obj, klass );
            },

            /**
             * @name extend
             * @grammar klass.extend({})
             * @desc �����������
             */
            extend: function( obj ) {
                var proto = klass.prototype,
                    superProto = superClass.prototype;

                staticlist.forEach(function( item ) {
                    obj[ item ] = mergeObj( superClass[ item ], obj[ item ] );
                    obj[ item ] && (klass[ item ] = obj[ item ]);
                    delete obj[ item ];
                });

                // todo ��plugin��origin�߼�������һ��
                eachObject( obj, function( key, val ) {
                    if ( typeof val === 'function' && superProto[ key ] ) {
                        proto[ key ] = function() {
                            var $super = this.$super,
                                ret;

                            // todo ֱ����this.$super = superProto[ key ];
                            this.$super = function() {
                                var args = slice.call( arguments, 1 );
                                return superProto[ key ].apply( this, args );
                            };

                            ret = val.apply( this, arguments );

                            $super === undefined ? (delete this.$super) :
                                (this.$super = $super);
                            return ret;
                        };
                    } else {
                        proto[ key ] = val;
                    }
                } );
            }
        } );

        klass.superClass = superClass;
        klass.prototype = Object.create( superClass.prototype );


        /*// �����ڷ�����ͨ��this.$super(name)�������ø����������磺this.$super('enable');
         object.$super = function( name ) {
         var fn = superClass.prototype[ name ];
         return $.isFunction( fn ) && fn.apply( this,
         slice.call( arguments, 1 ) );
         };*/

        klass.extend( object );

        return klass;
    }

    /**
     * @method define
     * @grammar gmu.define( name, object[, superClass] )
     * @class
     * @param {String} name ������ֱ�ʶ����
     * @param {Object} object
     * @desc ����һ��gmu���
     * @example
     * ####�������
     * ```javascript
     * gmu.define( 'Button', {
     *     _create: function() {
     *         var $el = this.getEl();
     *
     *         $el.addClass( 'ui-btn' );
     *     },
     *
     *     show: function() {
     *         console.log( 'show' );
     *     }
     * } );
     * ```
     *
     * ####���ʹ��
     * html����
     * ```html
     * <a id='btn'>��ť</a>
     * ```
     *
     * javascript����
     * ```javascript
     * var btn = $('#btn').button();
     *
     * btn.show();    // => show
     * ```
     *
     */
    gmu.define = function( name, object, superClass ) {
        gmu[ name ] = createClass( name, object, superClass );
        zeptolize( name );
    };

    /**
     * @desc �ж�object�ǲ��� widgetʵ��, klass����ʱ��Ĭ��ΪBase����
     * @method isWidget
     * @grammar gmu.isWidget( anything[, klass] ) => Boolean
     * @param {*} anything ��Ҫ�жϵĶ���
     * @param {String|Class} klass �ַ��������ࡣ
     * @example
     * var a = new gmu.Button();
     *
     * console.log( gmu.isWidget( a ) );    // => true
     * console.log( gmu.isWidget( a, 'Dropmenu' ) );    // => false
     */
    gmu.isWidget = function( obj, klass ) {

        // �����ַ�����case
        klass = typeof klass === 'string' ? gmu[ klass ] || blankFn : klass;
        klass = klass || gmu.Base;
        return obj instanceof klass;
    };

    /**
     * @class Base
     * @description widget���ࡣ����ֱ��ʹ�á�
     */
    gmu.Base = createClass( 'Base', {

        /**
         * @method _init
         * @grammar instance._init() => instance
         * @desc ����ĳ�ʼ��������������Ҫ��д�÷���
         */
        _init: blankFn,

        /**
         * @override
         * @method _create
         * @grammar instance._create() => instance
         * @desc �������DOM�ķ�����������Ҫ��д�÷���
         */
        _create: blankFn,


        /**
         * @method getEl
         * @grammar instance.getEl() => $el
         * @desc ���������$el
         */
        getEl: function() {
            return this.$el;
        },

        /**
         * @method on
         * @grammar instance.on(name, callback, context) => self
         * @desc �����¼�
         */
        on: event.on,

        /**
         * @method one
         * @grammar instance.one(name, callback, context) => self
         * @desc �����¼���ִֻ��һ�Σ�
         */
        one: event.one,

        /**
         * @method off
         * @grammar instance.off(name, callback, context) => self
         * @desc ��������¼�
         */
        off: event.off,

        /**
         * @method trigger
         * @grammar instance.trigger( name ) => self
         * @desc �ɷ��¼�, ��trigger�����Ȱ�options�ϵ��¼��ص�������ִ��
         * options�ϻص���������ͨ������event.stopPropagation()����ֹ�¼�ϵͳ�����ɷ�,
         * ���ߵ���event.preventDefault()��ֹ�����¼�ִ��
         */
        trigger: function( name ) {
            var evt = typeof name === 'string' ? new gmu.Event( name ) : name,
                args = [ evt ].concat( slice.call( arguments, 1 ) ),
                opEvent = this._options[ evt.type ],

            // �ȴ�����������������ʹ�õ�ʱ�򣬿����Ѿ���destory��ɾ���ˡ�
                $el = this.getEl();

            if ( opEvent && $.isFunction( opEvent ) ) {

                // �������ֵ��false,�൱��ִ��stopPropagation()��preventDefault();
                false === opEvent.apply( this, args ) &&
                (evt.stopPropagation(), evt.preventDefault());
            }

            event.trigger.apply( this, args );

            // triggerHandler��ð��
            $el && $el.triggerHandler( evt, (args.shift(), args) );

            return this;
        },

        /**
         * @method tpl2html
         * @grammar instance.tpl2html() => String
         * @grammar instance.tpl2html( data ) => String
         * @grammar instance.tpl2html( subpart, data ) => String
         * @desc ��template�����html�ַ����������� data ʱ��html��ͨ��$.parseTpl��Ⱦ��
         * template֧��ָ��subpart, ����subpartʱ��template����Ϊģ�壬����subpartʱ��
         * template[subpart]����Ϊģ�������
         */
        tpl2html: function( subpart, data ) {
            var tpl = this.template;

            tpl =  typeof subpart === 'string' ? tpl[ subpart ] :
                ((data = subpart), tpl);

            return data || ~tpl.indexOf( '<%' ) ? $.parseTpl( tpl, data ) : tpl;
        },

        /**
         * @method destroy
         * @grammar instance.destroy()
         * @desc ע�����
         */
        destroy: function() {

            // ���element�ϵ��¼�
            this.$el && this.$el.off( this.eventNs );

            this.trigger( 'destroy' );
            // ��������Զ����¼�
            this.off();


            this.destroyed = true;
        }

    }, Object );

    // ���¼���
    $.ui = gmu;
})( gmu, gmu.$ );

/**
 * @file ���������
 * @import core/widget.js, extend/highlight.js
 * @module GMU
 */
(function( gmu, $, undefined ) {

    /**
     * ���������
     *
     * @class Navigator
     * @constructor Html����
     * ```html
     *
     * ```
     *
     * javascript����
     * ```javascript
     *
     * ```
     * @param {dom | zepto | selector} [el] ������ʼ����������Ԫ��
     * @param {Object} [options] �����������������鿴[Options](#GMU:Navigator:options)
     * @grammar $( el ).navigator( options ) => zepto
     * @grammar new gmu.Navigator( el, options ) => instance
     */
    gmu.define( 'Navigator', {
        options: {

            /**
             * @property {Array} [content=null] �˵�����
             * @namespace options
             */
            content: null,

            /**
             * @property {String} [event='click'] �����¼���
             * @namespace options
             */
            event: 'click'
        },

        template: {
            list: '<ul>',
            item: '<li><a<% if( href ) { %> href="<%= href %>"<% } %>>' +
                '<%= text %></a></li>'
        },

        _create: function() {
            var me = this,
                opts = me._options,
                $el = me.getEl(),
                $list = $el.find( 'ul' ).first(),
                name = 'ui-' + me.widgetName,
                renderer,
                html;

            // ���û�а���ul�ڵ㣬��˵��ͨ��ָ��content��create
            // �����createģʽ�����ȥ���ܶ�ʱ������д����dom���ˡ�
            if ( !$list.length && opts.content ) {
                $list = $( me.tpl2html( 'list' ) );
                renderer = me.tpl2html( 'item' );

                html = '';
                opts.content.forEach(function( item ) {

                    // ������ṩĬ��ֵ��Ȼ��ͬʱĳЩkeyû�д�ֵ��parseTpl�ᱨ��
                    item = $.extend( {
                        href: '',
                        text: ''
                    }, typeof item === 'string' ? {
                        text: item
                    } : item );

                    html += renderer( item );
                });

                $list.append( html ).appendTo( $el );
            } else {

                // ����ֱ��ͨ��ul��ʼ�������
                if ( $el.is( 'ul, ol' ) ) {
                    $list = $el.wrap( '<div>' );
                    $el = $el.parent();
                }

                if ( opts.index === undefined ) {

                    // ���opts��û��ָ��index, ���Դ�dom�в鿴�Ƿ��бȽ�Ϊui-state-active��
                    opts.index = $list.find( '.ui-state-active' ).index();

                    // û�ҵ����Ǹ�ֵΪ0
                    ~opts.index || (opts.index = 0);
                }
            }

            me.$list = $list.addClass( name + '-list' );
            me.trigger( 'done.dom', $el.addClass( name ), opts );

            // bind Events
            $list.highlight( 'ui-state-hover', 'li' );
            $list.on( opts.event + me.eventNs,
                'li:not(.ui-state-disable)>a', function( e ) {
                    me._switchTo( $( this ).parent().index(), e );
                } );

            me.index = -1;
            me.switchTo( opts.index );
        },

        _switchTo: function( to, e ) {
            if ( to === this.index ) {
                return;
            }

            var me = this,
                list = me.$list.children(),
                evt = gmu.Event( 'beforeselect', e ),
                cur;

            me.trigger( evt, list.get( to ) );

            if ( evt.isDefaultPrevented() ) {
                return;
            }

            cur = list.removeClass( 'ui-state-active' )
                .eq( to )
                .addClass( 'ui-state-active' );

            me.index = to;
            return me.trigger( 'select', to, cur[ 0 ] );
        },

        /**
         * �л�����������ĳһ��
         * @param {Number} to ���
         * @method switchTo
         */
        switchTo: function( to ) {
            return this._switchTo( ~~to );
        },

        /**
         * ȡ��ѡ��
         * @method unselect
         */
        unselect: function() {
            this.index = -1;
            this.$list.children().removeClass( 'ui-state-active' );
        },

        /**
         * ��ȡ��ǰѡ�е����
         * @method getIndex
         */
        getIndex: function() {
            return this.index;
        }

        /**
         * @event ready
         * @param {Event} e gmu.Event����
         * @description �������ʼ����󴥷���
         */

        /**
         * @event beforeselect
         * @param {Event} e gmu.Event����
         * @param {Element} Ŀ��Ԫ��
         * @description ��ѡ�����ŷ����л�ǰ����
         */

        /**
         * @event select
         * @param {Event} e gmu.Event����
         * @param {Event} ��ǰѡ������
         * @param {Element} ��һ��ѡ���Ԫ��
         * @description ��ѡ�����ŷ����л��󴥷�
         */

        /**
         * @event destroy
         * @param {Event} e gmu.Event����
         * @description ��������ٵ�ʱ�򴥷�
         */
    } );
})( gmu, gmu.$ );

/**
 * @file ����������Ե��ʱ���Զ�����һ��������
 * @import widget/navigator/navigator.js, widget/navigator/$scrollable.js
 */
(function( gmu, $, undefined ) {
    gmu.Navigator.options.isScrollToNext = true;

    /**
     * ����������Ե��ʱ���Զ�����һ��������
     * @class isScrollToNext
     * @namespace Navigator
     * @pluginfor Navigator
     */
    gmu.Navigator.option( 'isScrollToNext', true, function() {
        var me = this,
            prevIndex;

        me.on( 'select', function( e, to, el ) {

            // ��һ���õ�ʱ��û��prevIndex, �̸���this.index�����Ʒ���
            if ( prevIndex === undefined ) {
                prevIndex = me.index ? 0 : 1;
            }

            var dir = to > prevIndex,

            // �������������prev������next
                target = $( el )[ dir ? 'next' : 'prev' ](),

            // ���û�����ڵģ��Լ���λ��Ҳ��Ҫ��⡣�����������
            // ������İ�ť��ֻ��ʾ��һ��
                offset = target.offset() || $( el ).offset(),
                within = me.$el.offset(),
                listOffset;

            if ( dir ? offset.left + offset.width > within.left +
                within.width : offset.left < within.left ) {
                listOffset = me.$list.offset();

                me.$el.iScroll( 'scrollTo', dir ? within.width -
                    offset.left + listOffset.left - offset.width :
                    listOffset.left - offset.left, 0, 400 );
            }

            prevIndex = to;
        } );
    } );
})( gmu, gmu.$ );

/**
 * @file Navigator�Ŀɹ������ ����iScroll��ʵ�֡�
 * @module GMU
 * @import widget/navigator/navigator.js, extend/iscroll.js, extend/event.ortchange.js
 */
(function( gmu, $, undefined ) {

    /**
     * @property {Object} [iScroll={}] iScroll����
     * @namespace options
     * @for Navigator
     * @uses Navigator.scrollable
     */
    gmu.Navigator.options.iScroll = {
        hScroll: true,
        vScroll: false,
        hScrollbar: false,
        vScrollbar: false
    };

    /**
     * Navigator�Ŀɹ������ ����iScroll��ʵ�֡�
     *
     * @class scrollable
     * @namespace Navigator
     * @pluginfor Navigator
     */
    gmu.Navigator.register( 'scrollable', {

        _init: function() {
            var me = this,
                opts = me._options;

            me.on( 'done.dom', function() {
                me.$list.wrap( '<div class="ui-scroller"></div>' );

                me.trigger( 'init.iScroll' );
                me.$el.iScroll( $.extend( {}, opts.iScroll ) );
            } );

            $( window ).on( 'ortchange' + me.eventNs,
                $.proxy( me.refresh, me ) );

            me.on('destroy', function(){
                me.$el.iScroll( 'destroy' );
                $( window ).off( 'ortchange' + me.eventNs );
            } );
        },

        /**
         * ˢ��iscroll
         * @method refresh
         * @for Navigator
         * @uses Navigator.scrollable
         */
        refresh: function() {
            this.trigger( 'refresh.iScroll' ).$el.iScroll( 'refresh' );
        }

        /**
         * @event refresh.iScroll
         * @param {Event} e gmu.Event����
         * @description iscrollˢ��ǰ����
         */
    } );
})( gmu, gmu.$ );

/**
 * @file ͼƬ�ֲ����
 * @import extend/touch.js, extend/event.ortchange.js, core/widget.js
 * @module GMU
 */
(function( gmu, $, undefined ) {
    var cssPrefix = $.fx.cssPrefix,
        transitionEnd = $.fx.transitionEnd,

    // todo ���3d�Ƿ�֧�֡�
        translateZ = ' translateZ(0)';

    /**
     * ͼƬ�ֲ����
     *
     * @class Slider
     * @constructor Html����
     * ```html
     * <div id="slider">
     *   <div>
     *       <a href="http://www.baidu.com/"><img lazyload="image1.png"></a>
     *       <p>1,��Coron��̫�����Լ�ɹ�ڡ�С��</p>
     *   </div>
     *   <div>
     *       <a href="http://www.baidu.com/"><img lazyload="image2.png"></a>
     *       <p>2,��Coron��̫�����Լ�ɹ�ڡ�С��</p>
     *   </div>
     *   <div>
     *       <a href="http://www.baidu.com/"><img lazyload="image3.png"></a>
     *       <p>3,��Coron��̫�����Լ�ɹ�ڡ�С��</p>
     *   </div>
     *   <div>
     *       <a href="http://www.baidu.com/"><img lazyload="image4.png"></a>
     *       <p>4,��Coron��̫�����Լ�ɹ�ڡ�С��</p>
     *   </div>
     * </div>
     * ```
     *
     * javascript����
     * ```javascript
     * $('#slider').slider();
     * ```
     * @param {dom | zepto | selector} [el] ������ʼ��Slider��Ԫ��
     * @param {Object} [options] �����������������鿴[Options](#GMU:Slider:options)
     * @grammar $( el ).slider( options ) => zepto
     * @grammar new gmu.Slider( el, options ) => instance
     */
    gmu.define( 'Slider', {

        options: {

            /**
             * @property {Boolean} [loop=false] �Ƿ���������
             * @namespace options
             */
            loop: false,

            /**
             * @property {Number} [speed=400] ����ִ���ٶ�
             * @namespace options
             */
            speed: 400,

            /**
             * @property {Number} [index=0] ��ʼλ��
             * @namespace options
             */
            index: 0,

            /**
             * @property {Object} [selector={container:'.ui-slider-group'}] �ڲ��ṹѡ��������
             * @namespace options
             */
            selector: {
                container: '.ui-slider-group'    // ������ѡ����
            }
        },

        template: {
            item: '<div class="ui-slider-item"><div href="<%= href %>">' +
                '<img src="<%= pic %>" alt="" /></div>' +
                '<% if( title ) { %><p><%= title %></p><% } %>' +
                '</div>'
        },

        _create: function() {
            var me = this,
                $el = me.getEl(),
                opts = me._options;

            me.index = opts.index;

            // ��ʼdom�ṹ
            me._initDom( $el, opts );

            // ����width
            me._initWidth( $el, me.index );
            me._container.on( transitionEnd + me.eventNs,
                $.proxy( me._tansitionEnd, me ) );

            // ת���¼����
            $( window ).on( 'ortchange' + me.eventNs, function() {
                me._initWidth( $el, me.index );
            } );
        },

        _initDom: function( $el, opts ) {
            var selector = opts.selector,
                viewNum = opts.viewNum || 1,
                items,
                container;

            // ��������ڵ��Ƿ�ָ��
            container = $el.find( selector.container );

            // û��ָ�������򴴽�����
            if ( !container.length ) {
                container = $( '<div></div>' );

                // ���û�д���content, ��root�ĺ�����Ϊ�ɹ���item
                if ( !opts.content ) {

                    // ���⴦��ֱ����ul��ʼ��slider��case
                    if ( $el.is( 'ul' ) ) {
                        this.$el = container.insertAfter( $el );
                        container = $el;
                        $el = this.$el;
                    } else {
                        container.append( $el.children() );
                    }
                } else {
                    this._createItems( container, opts.content );
                }

                container.appendTo( $el );
            }

            // ����Ƿ񹹳�ѭ������
            if ( (items = container.children()).length < viewNum + 1 ) {
                opts.loop = false;
            }

            // ����ڵ����ˣ���Ҫ���Ƽ���
            while ( opts.loop && container.children().length < 3 * viewNum ) {
                container.append( items.clone() );
            }

            this.length = container.children().length;

            this._items = (this._container = container)
                .addClass( 'ui-slider-group' )
                .children()
                .addClass( 'ui-slider-item' )
                .toArray();

            this.trigger( 'done.dom', $el.addClass( 'ui-slider' ), opts );
        },

        // ����items��������ݰ���render���뵽container��
        _createItems: function( container, items ) {
            var i = 0,
                len = items.length;

            for ( ; i < len; i++ ) {
                container.append( this.tpl2html( 'item', items[ i ] ) );
            }
        },

        _initWidth: function( $el, index, force ) {
            var me = this,
                width;

            // widthû�б仯����Ҫ����
            if ( !force && (width = $el.width()) === me.width ) {
                return;
            }

            me.width = width;
            me._arrange( width, index );
            me.height = $el.height();
            me.trigger( 'width.change');
        },

        // ����items
        _arrange: function( width, index ) {
            var items = this._items,
                i = 0,
                item,
                len;

            this._slidePos = new Array( items.length );

            for ( len = items.length; i < len; i++ ) {
                item = items[ i ];

                item.style.cssText += 'width:' + width + 'px;' +
                    'left:' + (i * -width) + 'px;';
                item.setAttribute( 'data-index', i );

                this._move( i, i < index ? -width : i > index ? width : 0, 0 );
            }

            this._container.css( 'width', width * len );
        },

        _move: function( index, dist, speed, immediate ) {
            var slidePos = this._slidePos,
                items = this._items;

            if ( slidePos[ index ] === dist || !items[ index ] ) {
                return;
            }

            this._translate( index, dist, speed );
            slidePos[ index ] = dist;    // ��¼Ŀ��λ��

            // ǿ��һ��reflow
            immediate && items[ index ].clientLeft;
        },

        _translate: function( index, dist, speed ) {
            var slide = this._items[ index ],
                style = slide && slide.style;

            if ( !style ) {
                return false;
            }

            style.cssText += cssPrefix + 'transition-duration:' + speed +
                'ms;' + cssPrefix + 'transform: translate(' +
                dist + 'px, 0)' + translateZ + ';';
        },

        _circle: function( index, arr ) {
            var len;

            arr = arr || this._items;
            len = arr.length;

            return (index % len + len) % arr.length;
        },

        _tansitionEnd: function( e ) {

            // ~~��������ת�����ȼ���parseInt( str, 10 );
            if ( ~~e.target.getAttribute( 'data-index' ) !== this.index ) {
                return;
            }

            this.trigger( 'slideend', this.index );
        },

        _slide: function( from, diff, dir, width, speed, opts ) {
            var me = this,
                to;

            to = me._circle( from - dir * diff );

            // �������loopģʽ����ʵ��λ�õķ���Ϊ׼
            if ( !opts.loop ) {
                dir = Math.abs( from - to ) / (from - to);
            }

            // ������ʼλ�ã�����Ѿ���λ���ϲ����ظ�����
            this._move( to, -dir * width, 0, true );

            this._move( from, width * dir, speed );
            this._move( to, 0, speed );

            this.index = to;
            return this.trigger( 'slide', to, from );
        },

        /**
         * �л����ڼ���slide
         * @method slideTo
         * @chainable
         * @param {Number} to Ŀ��slide�����
         * @param {Number} [speed] �л����ٶ�
         * @return {self} ���ر���
         */
        slideTo: function( to, speed ) {
            if ( this.index === to || this.index === this._circle( to ) ) {
                return this;
            }

            var opts = this._options,
                index = this.index,
                diff = Math.abs( index - to ),

            // 1����-1����
                dir = diff / (index - to),
                width = this.width;

            speed = speed || opts.speed;

            return this._slide( index, diff, dir, width, speed, opts );
        },

        /**
         * �л�����һ��slide
         * @method prev
         * @chainable
         * @return {self} ���ر���
         */
        prev: function() {

            if ( this._options.loop || this.index > 0 ) {
                this.slideTo( this.index - 1 );
            }

            return this;
        },

        /**
         * �л�����һ��slide
         * @method next
         * @chainable
         * @return {self} ���ر���
         */
        next: function() {

            if ( this._options.loop || this.index + 1 < this.length ) {
                this.slideTo( this.index + 1 );
            }

            return this;
        },

        /**
         * ���ص�ǰ��ʾ�ĵڼ���slide
         * @method getIndex
         * @chainable
         * @return {Number} ��ǰ��silde���
         */
        getIndex: function() {
            return this.index;
        },

        /**
         * �������
         * @method destroy
         */
        destroy: function() {
            this._container.off( this.eventNs );
            $( window ).off( 'ortchange' + this.eventNs );
            return this.$super( 'destroy' );
        }

        /**
         * @event ready
         * @param {Event} e gmu.Event����
         * @description �������ʼ����󴥷���
         */

        /**
         * @event done.dom
         * @param {Event} e gmu.Event����
         * @param {Zepto} $el sliderԪ��
         * @param {Object} opts �����ʼ��ʱ��������
         * @description DOM������ɺ󴥷�
         */

        /**
         * @event width.change
         * @param {Event} e gmu.Event����
         * @description slider������ȷ����仯ʱ����
         */

        /**
         * @event slideend
         * @param {Event} e gmu.Event����
         * @param {Number} index ��ǰslide�����
         * @description slide�л���ɺ󴥷�
         */

        /**
         * @event slide
         * @param {Event} e gmu.Event����
         * @param {Number} to Ŀ��slide�����
         * @param {Number} from ��ǰslide�����
         * @description slide�л�ʱ����������л�ʱ�ж��������¼�����ʱ��slide��һ���Ѿ�����л���
         */

        /**
         * @event destroy
         * @param {Event} e gmu.Event����
         * @description ��������ٵ�ʱ�򴥷�
         */
    } );

})( gmu, gmu.$ );

/**
 * @file ͼƬ�ֲ���ʾ�㹦��
 * @import widget/slider/slider.js
 */
(function( gmu, $, undefined ) {
    $.extend( true, gmu.Slider, {

        template: {
            dots: '<p class="ui-slider-dots"><%= new Array( len + 1 )' +
                '.join("<b></b>") %></p>'
        },

        options: {

            /**
             * @property {Boolean} [dots=true] �Ƿ���ʾ��
             * @namespace options
             * @for Slider
             * @uses Slider.dots
             */
            dots: true,

            /**
             * @property {Object} [selector={dots:'.ui-slider-dots'}] ���е㸸����ѡ����
             * @namespace options
             * @for Slider
             * @uses Slider.dots
             */
            selector: {
                dots: '.ui-slider-dots'
            }
        }
    } );

    /**
     * ͼƬ�ֲ���ʾ�㹦��
     * @class dots
     * @namespace Slider
     * @pluginfor Slider
     */
    gmu.Slider.option( 'dots', true, function() {

        var updateDots = function( to, from ) {
            var dots = this._dots;

            typeof from === 'undefined' || gmu.staticCall( dots[
                from % this.length ], 'removeClass', 'ui-state-active' );

            gmu.staticCall( dots[ to % this.length ], 'addClass',
                'ui-state-active' );
        };

        this.on( 'done.dom', function( e, $el, opts ) {
            var dots = $el.find( opts.selector.dots );

            if ( !dots.length ) {
                dots = this.tpl2html( 'dots', {
                    len: this.length
                } );

                dots = $( dots ).appendTo( $el );
            }

            this._dots = dots.children().toArray();
        } );

        this.on( 'slide', function( e, to, from ) {
            updateDots.call( this, to, from );
        } );

        this.on( 'ready', function() {
            updateDots.call( this, this.index );
        } );
    } );
})( gmu, gmu.$ );

/**
 * @file ͼƬ�ֲ���ָ������
 * @import widget/slider/slider.js
 */
(function( gmu, $, undefined ) {

    var map = {
            touchstart: '_onStart',
            touchmove: '_onMove',
            touchend: '_onEnd',
            touchcancel: '_onEnd',
            click: '_onClick'
        },

        isScrolling,
        start,
        delta,
        moved;

    // �ṩĬ��options
    $.extend( gmu.Slider.options, {

        /**
         * @property {Boolean} [stopPropagation=false] �Ƿ���ֹ�¼�ð��
         * @namespace options
         * @for Slider
         * @uses Slider.touch
         */
        stopPropagation: false,

        /**
         * @property {Boolean} [disableScroll=false] �Ƿ���ֹ����
         * @namespace options
         * @for Slider
         * @uses Slider.touch
         */
        disableScroll: false
    } );

    /**
     * ͼƬ�ֲ���ָ������
     * @class touch
     * @namespace Slider
     * @pluginfor Slider
     */
    gmu.Slider.register( 'touch', {
        _init: function() {
            var me = this,
                $el = me.getEl();

            me._handler = function( e ) {
                me._options.stopPropagation && e.stopPropagation();
                return map[ e.type ] && me[ map[ e.type ] ].call( me, e );
            };

            me.on( 'ready', function() {

                // ������
                $el.on( 'touchstart' + me.eventNs, me._handler );

                // ��ֹ����, ��ԥtouchmove��preventDefault�ˣ����³���Ҳ�ᴥ��click
                me._container.on( 'click' + me.eventNs, me._handler );
            } );
        },

        _onClick: function() {
            return !moved;
        },

        _onStart: function( e ) {

            // �������ָ
            if ( e.touches.length > 1 ) {
                return false;
            }

            var me = this,
                touche = e.touches[ 0 ],
                opts = me._options,
                eventNs = me.eventNs,
                num;

            start = {
                x: touche.pageX,
                y: touche.pageY,
                time: +new Date()
            };

            delta = {};
            moved = false;
            isScrolling = undefined;

            num = opts.viewNum || 1;
            me._move( opts.loop ? me._circle( me.index - num ) :
                me.index - num, -me.width, 0, true );
            me._move( opts.loop ? me._circle( me.index + num ) :
                me.index + num, me.width, 0, true );

            me.$el.on( 'touchmove' + eventNs + ' touchend' + eventNs +
                ' touchcancel' + eventNs, me._handler );
        },

        _onMove: function( e ) {

            // ��ָ�����Ų�����
            if ( e.touches.length > 1 || e.scale &&
                e.scale !== 1 ) {
                return false;
            }

            var opts = this._options,
                viewNum = opts.viewNum || 1,
                touche = e.touches[ 0 ],
                index = this.index,
                i,
                len,
                pos,
                slidePos;

            opts.disableScroll && e.preventDefault();

            delta.x = touche.pageX - start.x;
            delta.y = touche.pageY - start.y;

            if ( typeof isScrolling === 'undefined' ) {
                isScrolling = Math.abs( delta.x ) <
                    Math.abs( delta.y );
            }

            if ( !isScrolling ) {
                e.preventDefault();

                if ( !opts.loop ) {

                    // �������Ѿ���ͷ
                    delta.x /= (!index && delta.x > 0 ||

                        // ����ұߵ�ͷ
                        index === this._items.length - 1 &&
                        delta.x < 0) ?

                        // ����һ���ļ���
                        (Math.abs( delta.x ) / this.width + 1) : 1;
                }

                slidePos = this._slidePos;

                for ( i = index - viewNum, len = index + 2 * viewNum;
                      i < len; i++ ) {

                    pos = opts.loop ? this._circle( i ) : i;
                    this._translate( pos, delta.x + slidePos[ pos ], 0 );
                }

                moved = true;
            }
        },

        _onEnd: function() {

            // ����¼�
            this.$el.off( 'touchmove' + this.eventNs + ' touchend' +
                    this.eventNs + ' touchcancel' + this.eventNs,
                this._handler );

            if ( !moved ) {
                return;
            }

            var me = this,
                opts = me._options,
                viewNum = opts.viewNum || 1,
                index = me.index,
                slidePos = me._slidePos,
                duration = +new Date() - start.time,
                absDeltaX = Math.abs( delta.x ),

            // �Ƿ񻬳��߽�
                isPastBounds = !opts.loop && (!index && delta.x > 0 ||
                    index === slidePos.length - viewNum && delta.x < 0),

            // -1 ���� 1 ����
                dir = delta.x > 0 ? 1 : -1,
                speed,
                diff,
                i,
                len,
                pos;

            if ( duration < 250 ) {

                // ��������ٶȱȽϿ죬ƫ�����������ٶ�����
                speed = absDeltaX / duration;
                diff = Math.min( Math.round( speed * viewNum * 1.2 ),
                    viewNum );
            } else {
                diff = Math.round( absDeltaX / (me.perWidth || me.width) );
            }

            if ( diff && !isPastBounds ) {
                me._slide( index, diff, dir, me.width, opts.speed,
                    opts, true );

                // �������������Ҫ���ƶ�һ��
                if ( viewNum > 1 && duration >= 250 &&
                    Math.ceil( absDeltaX / me.perWidth ) !== diff ) {

                    me.index < index ? me._move( me.index - 1, -me.perWidth,
                        opts.speed ) : me._move( me.index + viewNum,
                        me.width, opts.speed );
                }
            } else {

                // ����ȥ
                for ( i = index - viewNum, len = index + 2 * viewNum;
                      i < len; i++ ) {

                    pos = opts.loop ? me._circle( i ) : i;
                    me._translate( pos, slidePos[ pos ],
                        opts.speed );
                }
            }
        }
    } );
})( gmu, gmu.$ );

/**
 * @file �Զ����Ų��
 * @import widget/slider/slider.js
 */
(function( gmu, $ ) {
    $.extend( true, gmu.Slider, {
        options: {
            /**
             * @property {Boolean} [autoPlay=true] �Ƿ����Զ�����
             * @namespace options
             * @for Slider
             * @uses Slider.autoplay
             */
            autoPlay: true,
            /**
             * @property {Number} [interval=4000] �Զ����ŵļ��ʱ�䣨���룩
             * @namespace options
             * @for Slider
             * @uses Slider.autoplay
             */
            interval: 4000
        }
    } );

    /**
     * �Զ����Ų��
     * @class autoplay
     * @namespace Slider
     * @pluginfor Slider
     */
    gmu.Slider.register( 'autoplay', {
        _init: function() {
            var me = this;
            me.on( 'slideend ready', me.resume )

                // ���timer
                .on( 'destory', me.stop );

            // ���⻬��ʱ���Զ��л�
            me.getEl()
                .on( 'touchstart' + me.eventNs, $.proxy( me.stop, me ) )
                .on( 'touchend' + me.eventNs, $.proxy( me.resume, me ) );
        },

        /**
         * �ָ��Զ����š�
         * @method resume
         * @chainable
         * @return {self} ���ر���
         * @for Slider
         * @uses Slider.autoplay
         */
        resume: function() {
            var me = this,
                opts = me._options;

            if ( opts.autoPlay && !me._timer ) {
                me._timer = setTimeout( function() {
                    me.slideTo( me.index + 1 );
                    me._timer = null;
                }, opts.interval );
            }
            return me;
        },

        /**
         * ֹͣ�Զ�����
         * @method stop
         * @chainable
         * @return {self} ���ر���
         * @for Slider
         * @uses Slider.autoplay
         */
        stop: function() {
            var me = this;

            if ( me._timer ) {
                clearTimeout( me._timer );
                me._timer = null;
            }
            return me;
        }
    } );
})( gmu, gmu.$ );

/**
 * @file ͼƬ�����ز��
 * @import widget/slider/slider.js
 */
(function( gmu ) {

    gmu.Slider.template.item = '<div class="ui-slider-item">' +
        '<a href="<%= href %>">' +
        '<img lazyload="<%= pic %>" alt="" /></a>' +
        '<% if( title ) { %><p><%= title %></p><% } %>' +
        '</div>';

    /**
     * ͼƬ�����ز��
     * @class lazyloadimg
     * @namespace Slider
     * @pluginfor Slider
     */
    gmu.Slider.register( 'lazyloadimg', {
        _init: function() {
            this.on( 'ready slide', this._loadItems );
        },

        _loadItems: function() {
            var opts = this._options,
                loop = opts.loop,
                viewNum = opts.viewNum || 1,
                index = this.index,
                i,
                len;

            for ( i = index - viewNum, len = index + 2 * viewNum; i < len;
                  i++ ) {

                this.loadImage( loop ? this._circle( i ) : i );
            }
        },

        /**
         * ����ָ��item�е�ͼƬ
         * @method loadImage
         * @param {Number} index Ҫ���ص�ͼƬ�����
         * @for Slider
         * @uses Slider.lazyloadimg
         */
        loadImage: function( index ) {
            var item = this._items[ index ],
                images;

            if ( !item || !(images = gmu.staticCall( item, 'find',
                'img[lazyload]' ), images.length) ) {

                return this;
            }

            images.each(function() {
                this.src = this.getAttribute( 'lazyload' );
                this.removeAttribute( 'lazyload' );
            });
        }
    } );
})( gmu );

/**
 * @file ͼƬ�Զ���Ӧ����
 * @import widget/slider/slider.js
 */
(function( gmu ) {

    /**
     * @property {Boolean} [imgZoom=true] �Ƿ���ͼƬ����Ӧ
     * @namespace options
     * @for Slider
     * @uses Slider.dots
     */
    gmu.Slider.options.imgZoom = true;

    /**
     * ͼƬ�Զ���Ӧ����
     * @class imgZoom
     * @namespace Slider
     * @pluginfor Slider
     */
    gmu.Slider.option( 'imgZoom', function() {
        return !!this._options.imgZoom;
    }, function() {
        var me = this,
            selector = me._options.imgZoom,
            watches;

        selector = typeof selector === 'string' ? selector : 'img';

        function unWatch() {
            watches && watches.off( 'load' + me.eventNs, imgZoom );
        }

        function watch() {
            unWatch();
            watches = me._container.find( selector )
                .on( 'load' + me.eventNs, imgZoom );
        }

        function imgZoom( e ) {
            var img = e.target || this;
            var heightTop;
            if(me._options.viewNum == 1)
            {
                img.style.width = me.width  + 'px';
            }
            else
            {
                img.style.width = (me.width / me._options.viewNum - 6) + 'px';
            }
        }

        me.on( 'ready dom.change', watch );
        me.on( 'width.change', function() {
            watches && watches.each( imgZoom );
        } );
        me.on( 'destroy', unWatch );
    } );
})( gmu );

/**
 * @file ���������
 * @import core/widget.js, extend/highlight.js, extend/parseTpl.js, extend/event.ortchange.js
 * @module GMU
 */
(function( gmu, $, undefined ) {
    var tpl = {
        close: '<a class="ui-dialog-close" title="�ر�"><span class="ui-icon ui-icon-delete"></span></a>',
        mask: '<div class="ui-mask"></div>',
        title: '<div class="ui-dialog-title">'+
            '<h3><%=title%></h3>'+
            '</div>',
        wrap: '<div class="ui-dialog">'+
            '<div class="ui-dialog-content"></div>'+
            '<% if(btns){ %>'+
            '<div class="ui-dialog-btns">'+
            '<% for(var i=0, length=btns.length; i<length; i++){var item = btns[i]; %>'+
            '<a class="ui-btn ui-btn-<%=item.index%>" data-key="<%=item.key%>"><%=item.text%></a>'+
            '<% } %>'+
            '</div>'+
            '<% } %>' +
            '</div> '
    };

    /**
     * ���������
     *
     * @class Dialog
     * @constructor Html����
     * ```html
     * <div id="dialog1" title="��½��ʾ">
     *     <p>��ʹ�ðٶ��˺ŵ�¼��, ��ø�����Ի���ɫ����</p>
     * </div>
     * ```
     *
     * javascript����
     * ```javascript
     *  $('#dialog1').dialog({
     *      autoOpen: false,
     *      closeBtn: false,
     *      buttons: {
     *          'ȡ��': function(){
     *              this.close();
     *          },
     *          'ȷ��': function(){
     *              this.close();
     *              $('#dialog2').dialog('open');
     *          }
     *      }
     *  });
     * ```
     * @param {dom | zepto | selector} [el] ������ʼ���Ի����Ԫ��
     * @param {Object} [options] �����������������鿴[Options](#GMU:Dialog:options)
     * @grammar $( el ).dialog( options ) => zepto
     * @grammar new gmu.Dialog( el, options ) => instance
     */
    gmu.define( 'Dialog', {
        options: {
            /**
             * @property {Boolean} [autoOpen=true] ��ʼ�����Ƿ��Զ�����
             * @namespace options
             */
            autoOpen: true,
            /**
             * @property {Array} [buttons=null] �������ϵİ�ť
             * @namespace options
             */
            buttons: null,
            /**
             * @property {Boolean} [closeBtn=true] �Ƿ���ʾ�رհ�ť
             * @namespace options
             */
            closeBtn: true,
            /**
             * @property {Boolean} [mask=true] �Ƿ������ֲ�
             * @namespace options
             */
            mask: true,
            /**
             * @property {Number} [width=300] ��������
             * @namespace options
             */
            width: 300,
            /**
             * @property {Number|String} [height='auto'] ������߶�
             * @namespace options
             */
            height: 'auto',
            /**
             * @property {String} [title=null] ���������
             * @namespace options
             */
            title: null,
            /**
             * @property {String} [content=null] ����������
             * @namespace options
             */
            content: null,
            /**
             * @property {Boolean} [scrollMove=true] �Ƿ���õ�scroll���ڵ�����ʱ��
             * @namespace options
             */
            scrollMove: true,
            /**
             * @property {Element} [container=null] ����������
             * @namespace options
             */
            container: null,
            /**
             * @property {Function} [maskClick=null] �������ϵ��ʱ�������¼�
             * @namespace options
             */
            maskClick: null,
            position: null //��Ҫdialog.position���������
        },

        /**
         * ��ȡ�����Ľڵ�
         * @method getWrap
         * @return {Element} �����Ľڵ�
         */
        getWrap: function(){
            return this._options._wrap;
        },

        _init: function(){
            var me = this, opts = me._options, btns,
                i= 0, eventHanlder = $.proxy(me._eventHandler, me), vars = {};

            me.on( 'ready', function() {
                opts._container = $(opts.container || document.body);
                (opts._cIsBody = opts._container.is('body')) || opts._container.addClass('ui-dialog-container');
                vars.btns = btns= [];
                opts.buttons && $.each(opts.buttons, function(key){
                    btns.push({
                        index: ++i,
                        text: key,
                        key: key
                    });
                });
                opts._mask = opts.mask ? $(tpl.mask).appendTo(opts._container) : null;
                opts._wrap = $($.parseTpl(tpl.wrap, vars)).appendTo(opts._container);
                opts._content = $('.ui-dialog-content', opts._wrap);

                opts._title = $(tpl.title);
                opts._close = opts.closeBtn && $(tpl.close).highlight('ui-dialog-close-hover');
                me.$el = me.$el || opts._content;//�������Ҫ֧��renderģʽ���˾�Ҫɾ��

                me.title(opts.title);
                me.content(opts.content);

                btns.length && $('.ui-dialog-btns .ui-btn', opts._wrap).highlight('ui-state-hover');
                opts._wrap.css({
                    width: opts.width,
                    height: opts.height
                });

                //bind events���¼�
                $(window).on('ortchange', eventHanlder);
                opts._wrap.on('click', eventHanlder);
                opts._mask && opts._mask.on('click', eventHanlder);
                opts.autoOpen && me.open();
            } );
        },

        _create: function(){
            var opts = this._options;

            if( this._options.setup ){
                opts.content = opts.content || this.$el.show();
                opts.title = opts.title || this.$el.attr('title');
            }
        },

        _eventHandler: function(e){
            var me = this, match, wrap, opts = me._options, fn;
            switch(e.type){
                case 'ortchange':
                    this.refresh();
                    break;
                case 'touchmove':
                    opts.scrollMove && e.preventDefault();
                    break;
                case 'click':
                    if(opts._mask && ($.contains(opts._mask[0], e.target) || opts._mask[0] === e.target )){
                        return me.trigger('maskClick');
                    }
                    wrap = opts._wrap.get(0);
                    if( (match = $(e.target).closest('.ui-dialog-close', wrap)) && match.length ){
                        me.close();
                    } else if( (match = $(e.target).closest('.ui-dialog-btns .ui-btn', wrap)) && match.length ) {
                        fn = opts.buttons[match.attr('data-key')];
                        fn && fn.apply(me, arguments);
                    }
            }
        },

        _calculate: function(){
            var me = this, opts = me._options, size, $win, root = document.body,
                ret = {}, isBody = opts._cIsBody, round = Math.round;

            opts.mask && (ret.mask = isBody ? {
                width:  '100%',
                height: Math.max(root.scrollHeight, root.clientHeight)-1//����1�Ļ�uc���������ת��ʱ�򲻴���resize.���⣡
            }:{
                width: '100%',
                height: '100%'
            });

            size = opts._wrap.offset();
            $win = $(window);
            ret.wrap = {
                left: '50%',
                marginLeft: -round(size.width/2) +'px',
                top: isBody?round($win.height() / 2) + window.pageYOffset:'50%',
                marginTop: -round(size.height/2) +'px'
            }
            return ret;
        },

        /**
         * �������µ�����λ�ú�mask��С���縸������С�����仯ʱ�����ܵ�����λ�ò��ԣ������ⲿ����refresh��������
         * @method refresh
         * @return {self} ���ر���
         */
        refresh: function(){
            var me = this, opts = me._options, ret, action;
            if(opts._isOpen) {

                action = function(){
                    ret = me._calculate();
                    ret.mask && opts._mask.css(ret.mask);
                    opts._wrap.css(ret.wrap);
                }

                //����м����ڣ���Ҫ�����ʱ
                if( $.os.ios &&
                    document.activeElement &&
                    /input|textarea|select/i.test(document.activeElement.tagName)){

                    document.body.scrollLeft = 0;
                    setTimeout(action, 200);//do it later in 200ms.

                } else {
                    action();//do it now
                }
            }
            return me;
        },

        /**
         * �������������������λ�ã��ڲ�����ֵת��[position](widget/dialog.js#position)������
         * @method open
         * @param {String|Number} [x] X��λ��
         * @param {String|Number} [y] Y��λ��
         * @return {self} ���ر���
         */
        open: function(x, y){
            var opts = this._options;
            opts._isOpen = true;

            opts._wrap.css('display', 'block');
            opts._mask && opts._mask.css('display', 'block');

            x !== undefined && this.position ? this.position(x, y) : this.refresh();

            $(document).on('touchmove', $.proxy(this._eventHandler, this));
            return this.trigger('open');
        },

        /**
         * �رյ�����
         * @method close
         * @return {self} ���ر���
         */
        close: function(){
            var eventData, opts = this._options;

            eventData = $.Event('beforeClose');
            this.trigger(eventData);
            if(eventData.defaultPrevented)return this;

            opts._isOpen = false;
            opts._wrap.css('display', 'none');
            opts._mask && opts._mask.css('display', 'none');

            $(document).off('touchmove', this._eventHandler);
            return this.trigger('close');
        },

        /**
         * ���û��߻�ȡ��������⡣value���ܴ�html��ǩ�ַ���
         * @method title
         * @param {String} [value] ���������
         * @return {self} ���ر���
         */
        title: function(value) {
            var opts = this._options, setter = value !== undefined;
            if(setter){
                value = (opts.title = value) ? '<h3>'+value+'</h3>' : value;
                opts._title.html(value)[value?'prependTo':'remove'](opts._wrap);
                opts._close && opts._close.prependTo(opts.title? opts._title : opts._wrap);
            }
            return setter ? this : opts.title;
        },

        /**
         * ���û��߻�ȡ���������ݡ�value���ܴ�html��ǩ�ַ�����zepto����
         * @method content
         * @param {String|Element} [val] ����������
         * @return {self} ���ر���
         */
        content: function(val) {
            var opts = this._options, setter = val!==undefined;
            setter && opts._content.empty().append(opts.content = val);
            return setter ? this: opts.content;
        },

        /**
         * @desc ���������
         * @name destroy
         */
        destroy: function(){
            var opts = this._options, _eventHander = this._eventHandler;
            $(window).off('ortchange', _eventHander);
            $(document).off('touchmove', _eventHander);
            opts._wrap.off('click', _eventHander).remove();
            opts._mask && opts._mask.off('click', _eventHander).remove();
            opts._close && opts._close.highlight();
            return this.$super('destroy');
        }

        /**
         * @event ready
         * @param {Event} e gmu.Event����
         * @description �������ʼ����󴥷���
         */

        /**
         * @event open
         * @param {Event} e gmu.Event����
         * @description �������򵯳��󴥷�
         */

        /**
         * @event beforeClose
         * @param {Event} e gmu.Event����
         * @description �ڵ�����ر�֮ǰ����������ͨ��e.preventDefault()����ֹ
         */

        /**
         * @event close
         * @param {Event} e gmu.Event����
         * @description �ڵ�����ر�֮�󴥷�
         */

        /**
         * @event destroy
         * @param {Event} e gmu.Event����
         * @description ��������ٵ�ʱ�򴥷�
         */
    });
})( gmu, gmu.$ );

/**
 * @file Dialog �� ���������
 * @module GMU
 * @import widget/dialog/dialog.js, extend/position.js
 */
(function( gmu, $, undefined ) {
    /**
     * @name dialog.position
     * @desc ��zepto.position����λdialog
     */
    /**
     * ��zepto.position����λdialog
     *
     * @class position
     * @namespace Dialog
     * @pluginfor Dialog
     */
    gmu.Dialog.register( 'position', {

        _init: function(){
            var opts = this._options;

            opts.position = opts.position || {of: opts.container || window, at: 'center', my: 'center'};
        },

        /**
         * �������õ������λ�ã�������������ã����Ĭ��Ϊ�������Ҿ��ж��롣λ�ò������ܣ���ֵ���ٷֱȣ�����λ����ֵ������'center'��
         * ��: 100�� 100px, 100em, 10%, center;��ʱ��֧�� left, right, top, bottom.
         * @method position
         * @param {String|Number} [x] X��λ��
         * @param {String|Number} [y] Y��λ��
         * @for Dialog
         * @uses Dialog.position
         * @return {self} ���ر���
         */
        position: function(x, y){
            var opts = this._options;
            if(!$.isPlainObject(x)){//�����ϸ�ʽ��
                opts.position.at = 'left'+(x>0?'+'+x: x)+' top'+(y>0?'+'+y: y);
            } else $.extend(opts.position, x);
            return this.refresh();
        },

        _calculate:function () {
            var me = this,
                opts = me._options,
                position = opts.position,
                ret = me.origin();

            opts._wrap.position($.extend(position, {
                using: function(position){
                    ret.wrap = position;
                }
            }));

            return ret;
        }
    } );
})( gmu, gmu.$);

/**
 * @file ѡ����
 * @import extend/touch.js, core/widget.js, extend/highlight.js, extend/event.ortchange.js
 * @importCSS transitions.css, loading.css
 * @module GMU
 */

(function( gmu, $, undefined )
{
    var _uid = 1,
        uid = function(){
            return _uid++;
        },
        idRE = /^#(.+)$/;

    /**
     * ѡ����
     *
     * @class Tabs
     * @constructor Html����
     * ```html
     * <div id="tabs">
     *      <ul>
     *         <li><a href="#conten1">Tab1</a></li>
     *         <li><a href="#conten2">Tab2</a></li>
     *         <li><a href="#conten3">Tab3</a></li>
     *     </ul>
     *     <div id="conten1">content1</div>
     *     <div id="conten2"><input type="checkbox" id="input1" /><label for="input1">ѡ���Һ�tabs�����л�</label></div>
     *     <div id="conten3">content3</div>
     * </div>
     * ```
     *
     * javascript����
     * ```javascript
     * $('#tabs').tabs();
     * ```
     * @param {dom | zepto | selector} [el] ������ʼ��Tab��Ԫ��
     * @param {Object} [options] �����������������鿴[Options](#GMU:Tabs:options)
     * @grammar $( el ).tabs( options ) => zepto
     * @grammar new gmu.Tabs( el, options ) => instance
     */
    gmu.define( 'Tabs', {
        options: {

            /**
             * @property {Number} [active=0] ��ʼʱ�ĸ�Ϊѡ��״̬�����ʱsetupģʽ�������2��li�ϼ���ui-state-active��ʽʱ��activeֵΪ1
             * @namespace options
             */
            active: 0,

            /**
             * @property {Array} [items=null] ��renderģʽ����Ҫ�������� ��ʽΪ\[{title:\'\', content:\'\', href:\'\'}\], href���Բ��裬������������ajax����
             * @namespace options
             */
            items:null,

            /**
             * @property {String} [transition='slide'] �����л�������Ŀǰֻ֧��slide���������޶���
             * @namespace options
             */
            transition: 'slide'
        },

        template: {
            nav:'<ul class="ui-tabs-nav">'+
                '<% var item; for(var i=0, length=items.length; i<length; i++) { item=items[i]; %>'+
                '<li<% if(i==active){ %> class="ui-state-active"<% } %>><a href="javascript:;"><%=item.title%></a></li>'+
                '<% } %></ul>',
            content:'<div class="ui-viewport ui-tabs-content">' +
                '<% var item; for(var i=0, length=items.length; i<length; i++) { item=items[i]; %>'+
                '<div<% if(item.id){ %> id="<%=item.id%>"<% } %> class="ui-tabs-panel <%=transition%><% if(i==active){ %> ui-state-active<% } %>"><%=item.content%></div>'+
                '<% } %></div>'
        },

        _init:function () {
            var me = this, _opts = me._options, $el, eventHandler = $.proxy(me._eventHandler, me);

            me.on( 'ready', function(){
                $el = me.$el;
                $el.addClass('ui-tabs');
                _opts._nav.on('click', eventHandler).children().highlight('ui-state-hover');
            } );

            $(window).on('ortchange', eventHandler);
        },

        _create:function () {
            var me = this, _opts = me._options;

            if( me._options.setup && me.$el.children().length > 0 ) {
                me._prepareDom('setup', _opts);
            } else {
                _opts.setup = false;
                me.$el = me.$el || $('<div></div>');
                me._prepareDom('create', _opts);
            }
        },

        _prepareDom:function (mode, _opts) {
            var me = this, content, $el = me.$el, items, nav, contents, id;
            switch (mode) {
                case 'setup':
                    _opts._nav =  me._findElement('ul').first();
                    if(_opts._nav) {
                        _opts._content = me._findElement('div.ui-tabs-content');
                        _opts._content = ((_opts._content && _opts._content.first()) || $('<div></div>').appendTo($el)).addClass('ui-viewport ui-tabs-content');
                        items = [];
                        _opts._nav.addClass('ui-tabs-nav').children().each(function(){
                            var $a = me._findElement('a', this), href = $a?$a.attr('href'):$(this).attr('data-url'), id, $content;
                            id = idRE.test(href)? RegExp.$1: 'tabs_'+uid();
                            ($content = me._findElement('#'+id) || $('<div id="'+id+'"></div>'))
                                .addClass('ui-tabs-panel'+(_opts.transition?' '+_opts.transition:''))
                                .appendTo(_opts._content);
                            items.push({
                                id: id,
                                href: href,
                                title: $a?$a.attr('href', 'javascript:;').text():$(this).text(),//���href��ɾ���Ļ�����ַ������֣�Ȼ��һ������ʧ��
                                content: $content
                            });
                        });
                        _opts.items = items;
                        _opts.active = Math.max(0, Math.min(items.length-1, _opts.active || $('.ui-state-active', _opts._nav).index()||0));
                        me._getPanel().add(_opts._nav.children().eq(_opts.active)).addClass('ui-state-active');
                        break;
                    } //if cannot find the ul, switch this to create mode. Doing this by remove the break centence.
                default:
                    items = _opts.items = _opts.items || [];
                    nav = [];
                    contents = [];
                    _opts.active = Math.max(0, Math.min(items.length-1, _opts.active));
                    $.each(items, function(key, val){
                        id = 'tabs_'+uid();
                        nav.push({
                            href: val.href || '#'+id,
                            title: val.title
                        });
                        contents.push({
                            content: val.content || '',
                            id: id
                        });
                        items[key].id = id;
                    });
                    _opts._nav = $( this.tpl2html( 'nav', {items: nav, active: _opts.active} ) ).prependTo($el);
                    _opts._content = $( this.tpl2html( 'content', {items: contents, active: _opts.active, transition: _opts.transition} ) ).appendTo($el);
                    _opts.container = _opts.container || ($el.parent().length ? null : 'body');
            }
            _opts.container && $el.appendTo(_opts.container);
            me._fitToContent(me._getPanel());
        },

        _getPanel: function(index){
            var _opts = this._options;
            return $('#' + _opts.items[index === undefined ? _opts.active : index].id);
        },

        _findElement:function (selector, el) {
            var ret = $(el || this.$el).children(selector);
            return ret.length ? ret : null;
        },

        _eventHandler:function (e) {
            var match, _opts = this._options;
            switch(e.type) {
                case 'ortchange':
                    this.refresh();
                    break;
                default:
                    if((match = $(e.target).closest('li', _opts._nav.get(0))) && match.length) {
                        e.preventDefault();
                        this.switchTo(match.index());
                    }
            }
        },

        _fitToContent: function(div) {
            var _opts = this._options, $content = _opts._content;
            _opts._plus === undefined && (_opts._plus = parseFloat($content.css('border-top-width'))+parseFloat($content.css('border-bottom-width')))
            $content.height( div.height() + _opts._plus);
            var $par = $content.parent().parent();

            if($par && $par.hasClass('ui-viewport'))
            {
                var navHeight = $content.prev().height();
                $par.height(parseFloat($par.css('border-top-width'))+parseFloat($par.css('border-bottom-width')) +  div.height() + _opts._plus + navHeight);
            }
            return this;
        },

        /**
         * �л���ĳ��Tab
         * @method switchTo
         * @param {Number} index Tab���
         * @chainable
         * @return {self} ���ر���
         */
        switchTo: function(index) {
            var me = this, _opts = me._options, items = _opts.items, eventData, to, from, reverse, endEvent;
            if(!_opts._buzy && _opts.active != (index = Math.max(0, Math.min(items.length-1, index)))) {
                to = $.extend({}, items[index]);//copy it.
                to.div = me._getPanel(index);
                to.index = index;

                from = $.extend({}, items[_opts.active]);//copy it.
                from.div = me._getPanel();
                from.index = _opts.active;

                eventData = gmu.Event('beforeActivate');
                me.trigger(eventData, to, from);
                if(eventData.isDefaultPrevented()) return me;

                _opts._content.children().removeClass('ui-state-active');
                to.div.addClass('ui-state-active');
                _opts._nav.children().removeClass('ui-state-active').eq(to.index).addClass('ui-state-active');
                if(_opts.transition) { //use transition
                    _opts._buzy = true;
                    endEvent = $.fx.animationEnd + '.tabs';
                    reverse = index>_opts.active?'':' reverse';
                    _opts._content.addClass('ui-viewport-transitioning');
                    from.div.addClass('out'+reverse);
                    to.div.addClass('in'+reverse).on(endEvent, function(e){
                        if (e.target != e.currentTarget) return //�����ð�������ģ��򲻲���
                        to.div.off(endEvent, arguments.callee);//�����
                        _opts._buzy = false;
                        from.div.removeClass('out reverse');
                        to.div.removeClass('in reverse');
                        _opts._content.removeClass('ui-viewport-transitioning');
                        me.trigger('animateComplete', to, from);
                        me._fitToContent(to.div);
                    });
                }
                _opts.active = index;
                me.trigger('activate', to, from);
                _opts.transition ||  me._fitToContent(to.div);
            }
            return me;
        },

        /**
         * ���ⲿ�޸�tabs���ݺã���Ҫ����refresh��tabs�Զ����¸߶�
         * @method refresh
         * @chainable
         * @return {self} ���ر���
         */
        refresh: function(){
            return this._fitToContent(this._getPanel());
        },

        /**
         * �������
         * @method destroy
         */
        destroy:function () {
            var _opts = this._options, eventHandler = this._eventHandler;
            _opts._nav.off('tap', eventHandler).children().highlight();
            _opts.swipe && _opts._content.off('swipeLeft swipeRight', eventHandler);

            if( !_opts.setup ) {
                this.$el.remove();
            }
            return this.$super('destroy');
        }

        /**
         * @event ready
         * @param {Event} e gmu.Event����
         * @description �������ʼ����󴥷���
         */

        /**
         * @event beforeActivate
         * @param {Event} e gmu.Event����
         * @param {Object} to �����������ԣ�div(����div), index(λ��), title(����), content(����), href(����)
         * @param {Object} from �����������ԣ�div(����div), index(λ��), title(����), content(����), href(����)
         * @description �����л�֮ǰ����������ͨ��e.preventDefault()����ֹ
         */

        /**
         * @event activate
         * @param {Event} e gmu.Event����
         * @param {Object} to �����������ԣ�div(����div), index(λ��), title(����), content(����), href(����)
         * @param {Object} from �����������ԣ�div(����div), index(λ��), title(����), content(����), href(����)
         * @description �����л�֮�󴥷�
         */

        /**
         * @event animateComplete
         * @param {Event} e gmu.Event����
         * @param {Object} to �����������ԣ�div(����div), index(λ��), title(����), content(����), href(����)
         * @param {Object} from �����������ԣ�div(����div), index(λ��), title(����), content(����), href(����)
         * @description ������ɺ�ִ�У����û�����ö�������ʱ�䲻�ᴥ��
         */

        /**
         * @event destroy
         * @param {Event} e gmu.Event����
         * @description ��������ٵ�ʱ�򴥷�
         */
    });
})( gmu, gmu.$ );

/**
 * @file ajax���
 * @import widget/tabs/tabs.js
 */
(function ($, undefined) {
    var idRE = /^#.+$/,
        loaded = {},
        tpl = {
            loading: '<div class="ui-loading">Loading</div>',
            error: '<p class="ui-load-error">���ݼ���ʧ��!</p>'
        };

    /**
     * ��a����href���õ��ǵ�ַ��������id���������Ϊ���Ϊajax���͵ġ���options�ϴ���ajax�����������[ajaxѡ��](#$.ajax)
     * @class ajax
     * @namespace Tabs
     * @pluginfor Tabs
     */
    gmu.Tabs.register( 'ajax', {
        _init:function () {
            var _opts = this._options, items, i, length;

            this.on( 'ready', function(){
                items = _opts.items;
                for (i = 0, length = items.length; i < length; i++) {
                    items[i].href && !idRE.test(items[i].href) && (items[i].isAjax = true);
                }
                this.on('activate', this._onActivate);
                items[_opts.active].isAjax && this.load(_opts.active);//�����ǰ��ajax
            } );
        },

        destroy:function () {
            this.off('activate', this._onActivate);
            this.xhr && this.xhr.abort();
            return this.origin();
        },

        _fitToContent: function(div) {
            var _opts = this._options;

            if(!_opts._fitLock)return this.origin(div);
        },

        _onActivate:function (e, to) {
            to.isAjax && this.load(to.index);
        },

        /**
         * �������ݣ�ָ����tab������ajax���͡����ص����ݻỺ�����������Ҫǿ���ٴμ��أ��ڶ�����������true
         * @method load
         * @param {Number} index Tab���
         * @param {Boolean} [force=false] �Ƿ�ǿ�����¼���
         * @for Tabs
         * @uses Tabs.ajax
         * @return {self} ���ر���
         */
        load:function (index, force) {
            var me = this, _opts = me._options, items = _opts.items, item, $panel, prevXHR;

            if (index < 0 ||
                index > items.length - 1 ||
                !(item = items[index]) || //�����Χ����
                !item.isAjax || //�������ajax���͵�
                ( ( $panel = me._getPanel(index)).text() && !force && loaded[index] ) //���û�м��ع�������tab����Ϊ��
                )return this;

            (prevXHR = me.xhr) && setTimeout(function(){//���г�ȥû�м������xhr abort��
                prevXHR.abort();
            }, 400);

            _opts._loadingTimer = setTimeout(function () {//���������50ms������ˣ���û��Ҫ��ȥ��ʾ loading��
                $panel.html(tpl.loading);
            }, 50);

            _opts._fitLock = true;

            me.xhr = $.ajax($.extend(_opts.ajax || {}, {
                url:item.href,
                context:me.$el.get(0),
                beforeSend:function (xhr, settings) {
                    var eventData = gmu.Event('beforeLoad');
                    me.trigger(eventData, xhr, settings);
                    if (eventData.isDefaultPrevented())return false;
                },
                success:function (response, xhr) {
                    var eventData = gmu.Event('beforeRender');
                    clearTimeout(_opts._loadingTimer);//�����ʾloading�ļ�ʱ��
                    me.trigger(eventData, response, $panel, index, xhr)//�ⲿ�����޸�data������ֱ�Ӱ�pannel�޸���
                    if (!eventData.isDefaultPrevented()) {
                        $panel.html(response);
                    }
                    _opts._fitLock = false;
                    loaded[index] = true;
                    me.trigger('load', $panel);
                    delete me.xhr;
                    me._fitToContent($panel);
                },
                error:function () {
                    var eventData = gmu.Event('loadError');
                    clearTimeout(_opts._loadingTimer);//�����ʾloading�ļ�ʱ��
                    loaded[index] = false;
                    me.trigger(eventData, $panel);
                    if(!eventData.isDefaultPrevented()){
                        $panel.html(tpl.error);
                    }
                    delete me.xhr;
                }
            }));
        }

        /**
         * @event beforeLoad
         * @param {Event} e gmu.Event����
         * @param {Object} xhr xhr����
         * @param {Object} settings ajax����Ĳ���
         * @description ������ǰ����������ͨ��e.preventDefault()��ȡ���˴�ajax����
         * @for Tabs
         * @uses Tabs.ajax
         */

        /**
         * @event beforeRender
         * @param {Event} e gmu.Event����
         * @param {Object} response ����ֵ
         * @param {Object} panel ��Ӧ��Tab���ݵ�����
         * @param {Number} index Tab�����
         * @param {Object} xhr xhr����
         * @description ajax����������ݣ���render��div��֮ǰ����������json���ݣ�����ͨ���˷�������дrender��Ȼ��ͨ��e.preventDefault()����ֹ����response�����div��
         * @for Tabs
         * @uses Tabs.ajax
         */

        /**
         * @event load
         * @param {Event} e gmu.Event����
         * @param {Zepto} panel ��Ӧ��Tab���ݵ�����
         * @description ��ajax���󵽵����ݹ�����ƽ�Ѿ�Render��div���˺󴥷�
         * @for Tabs
         * @uses Tabs.ajax
         */

        /**
         * @event loadError
         * @param {Event} e gmu.Event����
         * @param {Zepto} panel ��Ӧ��Tab���ݵ�����
         * @description ��ajax��������ʧ��ʱ������������¼���preventDefault�ˣ��򲻻���Դ��Ĵ�����ϢRender��div��
         * @for Tabs
         * @uses Tabs.ajax
         */
    } );
})(Zepto);


if(window.localStorage)
{
    var collectObj = {length:0}, historyCarArr =[], historyShopArr = [];
    if(localStorage.getItem("collectObj"))
    {
        collectObj = JSON.parse(localStorage.getItem("collectObj"));
    }
    if(localStorage.getItem("historyCarArr"))
    {
        historyCarArr = JSON.parse(localStorage.getItem("historyCarArr"));
    }
    if(localStorage.getItem("historyShopArr"))
    {
        historyShopArr = JSON.parse(localStorage.getItem("historyShopArr"));
    }
}
function createCarItem(itemExample ,itemData)
{
    var $item = $(itemExample.cloneNode(true));
    $item.find('a').attr('href', itemData.url);
    $item.find(".carItem").text(itemData.name);
    $item.find(".carPrice").find('i').text(itemData.price);
    return $item;
}

function createShopItem(itemExample ,itemData)
{
    var $item = $(itemExample.cloneNode(true));
    $item.find('a').attr('href', itemData.url);
    $item.find(".shopItem").text(itemData.name);
    return $item;
}

//�����������е�λ��
function indexOfArr(arr, url)
{
    var len = arr.length;
    for(var i = 0; i < len; ++i)
    {
        if(arr[i].url === url)
        {
            return i;
        }
    }
    return -1;
}

function initHistory(historyCarArr, historyShopArr, carItem, shopItem)
{
    var carLen = historyCarArr.length;
    var shopLen = historyShopArr.length;
    if(carLen === 0 && shopLen === 0)
    {
        $("#browsing-record-list").html('<p>��ʱ�������¼</p>');
        return;
    }
    var $container = $('#browsing-record-list').empty();

    for(var i = 0; i < carLen; ++i)
    {
        var $item;
        $item = createCarItem(carItem, historyCarArr[i]);
        $container.prepend($item);
    }

    for(var i = 0; i < shopLen; ++i)
    {
        var $item;
        $item = createShopItem(shopItem, historyShopArr[i]);
        $container.prepend($item);
    }

    $container.find(".deleteBtn").each(function(i, item)
    {
        $(this).on("tap", function()
        {
            var $curNode = $(this).parent();
            var href = $curNode.find('a').attr('href');
            if($curNode.find('a').hasClass('carItem'))
            {
                var index = indexOfArr(historyCarArr, href);
                if(index !== -1)
                {
                    historyCarArr.splice(index, 1);
                }
                window.localStorage.setItem('historyCarArr', JSON.stringify(historyCarArr));
            }
            else if($curNode.find('a').hasClass('shopItem'))
            {
                var index = indexOfArr(historyShopArr, href);
                if(index !== -1)
                {
                    historyShopArr.splice(index, 1);
                }
                window.localStorage.setItem('historyShopArr', JSON.stringify(historyShopArr));
            }

            if(historyShopArr.length === 0 && historyCarArr.length === 0)
            {
                $("#browsing-record-list").html('<p>��ʱ�������¼</p>');
            }
            $(this).parent().remove();
        });
    });
}

function initCollect(collectObj, carItem, shopItem)
{
    var len = collectObj.length;
    if(len === 0)
    {
        $("#collect-record-list").html('<p>��ʱ���ղؼ�¼</p>');
        return;
    }
    var $container = $('#collect-record-list').empty();
    for(var url in collectObj)
    {
        var $item;
        if(collectObj[url].type == "car")
        {
            $item = createCarItem(carItem, collectObj[url]);
        }
        else if(collectObj[url].type == "shop")
        {
            $item = createShopItem(shopItem, collectObj[url]);
        }
        $container.prepend($item);
    }
    $container.find(".deleteBtn").each(function(i, item)
    {
        $(this).on("tap", function()
        {
            var href = $container.find('li').eq(i).find('a').attr('href');
            delete collectObj[href];
            --collectObj.length;
            window.localStorage.setItem('collectObj', JSON.stringify(collectObj));
            if(collectObj.length === 0)
            {
                $("#collect-record-list").html('<p>��ʱ���ղؼ�¼</p>');
            }
            $(this).parent().remove();
            if(window.location.href == href && $("#collectBtn").hasClass('active'))
            {
                $("#collectBtn").removeClass('active').text('�ղش˳�');
            }
        });
    });
}

function clearBtnHandler()
{
    //��հ�ť
    $('#clearBtn').on('tap', function()
    {
        if($('#collect-record-wrap').hasClass('ui-state-active'))
        {
            collectObj = {length:0};
            localStorage.setItem('collectObj', JSON.stringify(collectObj));
            $('#collect-record-list').empty();
            $("#collect-record-list").html('<p>��ʱ���ղؼ�¼</p>');
            $("#collectBtn").removeClass('active').text('�ղش˳�');
        }
        else
        {
            historyCarArr = historyShopArr = [];
            localStorage.setItem('historyCarArr', JSON.stringify(historyCarArr));
            localStorage.setItem('historyShopArr', JSON.stringify(historyShopArr));
            $('#browsing-record-list').empty();
            $("#browsing-record-list").html('<p>��ʱ�������¼</p>');
        }
    });
}

function initComponent(carItem, shopItem)
{
    //�رչ����
    $('#banner').find('.close').on('click', function () {
        $('#banner').hide();
        return false;
    });

    //��������
    $('#nav').navigator();

    $('#nav_arrow').on('tap', function () {
        $('#nav').iScroll('scrollTo', 100, 0, 400, true);
    });

    //չ����ر�
    $('.readmore').on('tap', function () {
        $(this).toggleClass('closemore').parent().next().toggle();
    });

    //tabs�л�
    $(".history-tabs").tabs();

    //��ʷ���ղ�
    $("#history").on("tap", function()
    {
        $('.search-wrap').css('visibility', 'hidden');

        var $history_wrap = $('.history-wrap');
        if($history_wrap.css('visibility') == 'hidden')
        {
            initHistory(historyCarArr, historyShopArr, carItem, shopItem);
            initCollect(collectObj, carItem, shopItem);
            $history_wrap.css('visibility', 'visible');
            $("#static-part").hide();
        }
        else
        {
            $history_wrap.css('visibility', 'hidden');
            $("#static-part").show();
        }
    });
    $('#closeBtn').on('tap', function()
    {
        $('.history-wrap').css('visibility', 'hidden');
        $("#static-part").show();
    });

    //������
    $("#search").on("tap", function()
    {
        $('.history-wrap').css('visibility', 'hidden');
        var $search_wrap = $('.search-wrap');
        if($search_wrap.css('visibility') == 'hidden')
        {
            $search_wrap.css('visibility', 'visible');
            $("#static-part").hide();
        }
        else
        {
            $search_wrap.css('visibility', 'hidden');
            $("#static-part").show();
        }
    });
}

function initSuggestDialog()
{
    //����Ի���
    $("#suggest-dialog").dialog({
        autoOpen:false,
        closeBtn:false,
        buttons: {
            "ȡ��": function(){
                this.close();
            },
            "ȷ��": function(){
                if(doSuggest()) {
                    this.close();
                }
            }
        }
    });
    //��������Ի���
    $("#suggestion").on('tap', function()
    {
        $('#suggest-dialog').dialog('open');
    });
}

function initReportDialog()
{
    //�ٱ��Ի���
    $("#report-dialog").dialog({
        autoOpen:false,
        closeBtn:false,
        title:"�ٱ�",
        buttons: {
            "ȡ��": function(){
                this.close();
            },
            "ȷ��": function(){
                if(doAccusation()) {
                    this.close();
                }
            }
        }
    });
    //�����ٱ��Ի���
    $('.report').on('tap', function()
    {
        $('#report-dialog').dialog('open');
        return false;
    });
}

function initMessageDialog()
{
    //���ԶԻ���
    $("#message-dialog").dialog({
        autoOpen:false,
        closeBtn:false,
        title:"����",
        buttons: {
            "ȡ��": function(){
                this.close();
            },
            "ȷ��": function(){
                if(doSubmitsss($("#defaultDealerId").val())) {
                    this.close();
                }
            }
        }
    });

    //�������ԶԻ���
    $('.message').on('tap', function()
    {
        $("#defaultDealerId").val($(this).parent().parent().parent().data('id'));
        $('#message-dialog').dialog('open');
        return false;
    });
}

function sameParameters(caro){
    var param = "carId=" + caro;
    var url = "/sccar/sameParameters/";
    url=encodeURI(url);
    url=encodeURI(url);
    var preMsg = "";
    var moreLow = "";
    var msg = "";
    $.ajax({url:url, type:"post", data: param, async: false, success:function (data1) {
        if(data1 == undefined || data1 == "undefined"){
            return;
        }
        var parentObj = data1;

        if(data1.carInfo.sameSize != null && parseInt(data1.carInfo.sameSize) > 0){
            moreLow += "<span class=\"end\">�����ػ���<a href='" + data1.carInfo.sameUrl + "'><i>" + data1.carInfo.sameSize + "</i></a>̨�����˵ĳ���</span>";
        } else {
            moreLow += "�ó�Ϊ������ͼ�&nbsp;";
        }
        var salePrice = data1.carInfo.price;
        var size = data1.carInfo.sameSize;
        var firstLicenseDate = data1.carInfo.carAndExtAndPics.scCarWithPics.firstLicenseDate ;
        var trimId = data1.carInfo.carAndExtAndPics.scCarWithPics.trimmId;
        if(firstLicenseDate != "��δ����" && trimId > 100000){
            firstLicenseYear = firstLicenseDate.substring(0,firstLicenseDate.indexOf("��"));
            firstLicenseMonth = firstLicenseDate.substring(firstLicenseDate.indexOf("��")+1,firstLicenseDate.indexOf("��"));
            if(firstLicenseMonth < 10){
                firstLicenseMonth = "0"+firstLicenseMonth;
            }
            var miage = data1.carInfo.mileageStr;
            var mi = parseInt(miage);
            mi = mi * 10000;
            firstLicenseDate = firstLicenseYear+"-"+firstLicenseMonth+"-01";
            var param = "brandId=" + data1.carInfo.carAndExtAndPics.scCarWithPics.brandId + "&modelId=" + data1.carInfo.carAndExtAndPics.scCarWithPics.modelId + "&modelYear=" + data1.carInfo.carAndExtAndPics.scCarWithPics.modelYear + "&trimId=" + data1.carInfo.carAndExtAndPics.scCarWithPics.trimmId + "&province=" + data1.carInfo.carAndExtAndPics.scCarWithPics.licenseProvince + "&city=" + data1.carInfo.carAndExtAndPics.scCarWithPics.licenseCity + "&carName=" + data1.carInfo.carAndExtAndPics.scCarWithPics.enterTrimmName + "&firstLicenseDate=" +firstLicenseDate+"&mileAge=" + mi;
            var url = "/interface/carinfo/evaluation/?"+param;
            url=encodeURI(url);
            url=encodeURI(url);
            $.ajax({url:url, type:"post", async: false, success:function (data) {
                var dataObj = eval("(" + data + ")");
                if(dataObj.result == "success"){
                    if(dataObj.estimatePrice){
                        var estimatePrice = dataObj.estimatePrice;
                        estimatePrice = estimatePrice.replace("&nbsp;","").replace("��","");
                        var estimatePriceArr = estimatePrice.split("~");
                        var estimatePriceMin = 0;
                        var estimatePriceMax = 0;
                        if(estimatePriceArr.length > 1){
                            estimatePriceMin = estimatePriceArr[0];
                            estimatePriceMax = estimatePriceArr[1];
                        }
                        var estimatePriceStr = "";
                        if(estimatePriceMin == 0){
                            estimatePriceStr = estimatePriceMax+"������";
                        }else if(estimatePriceMax == 0){
                            estimatePriceStr = estimatePriceMin+"������";
                        }else if(estimatePriceMin != 0 && estimatePriceMax != 0){
                            estimatePriceStr = dataObj.estimatePrice;
                        }else{
                            estimatePriceStr = dataObj.estimatePrice;
                        }
                        if(size == 0 && parseFloat(salePrice) > parseFloat(estimatePriceMax)){

                        }else if(size != 0 && parseFloat(salePrice) < parseFloat(estimatePriceMin)){

                        }else{
                            var cUrl = "";
                            if(parentObj.carInfo.url != null && parentObj.carInfo.url.length > 0){
                                cUrl = parentObj.carInfo.url;
                            }
                            preMsg += "<span class=\"left\">80%�������ۣ�</span>";
                            preMsg += "<span class=\"right\"><a href=/"+ cUrl +"/auto1-"+ parentObj.carInfo.scModel.enName +"/>" + estimatePriceStr + "</a></span>";
                        }
                    }
                }
            }});
        }

    }});
    msg = preMsg + moreLow;
    $("#sameParamersDiv").html(msg);
}

function initSameDisplayCars(carO){
    var type = 0;
    var url = "/sccar/sameCars/?carId=" + carO;
    url=encodeURI(url);
    url=encodeURI(url);
    $.ajax({url:url, type:"get", success:function (data) {
        if(data == undefined || data == "undefined"){
            return;
        }
        var sameTypes = "";
        if(data.carInfo.carAndExtAndPics.sameTypeCarList != null && data.carInfo.carAndExtAndPics.sameTypeCarList.length > 0){
            $.each(data.carInfo.carAndExtAndPics.sameTypeCarList, function(i, item){
                sameTypes += "<li class=\"car-item\">";
                sameTypes += "<a href=" + data.carInfo.sameTypeLinks[i] + " class=\"car-tit\">" + item.enterTrimmName + "</a>";
                if(item.flag3 == 1) {
                    sameTypes +="<span class=\"authentication\">��</span>";
                }
                sameTypes +="<div class=\"description\">";
                sameTypes += "<div class=\"left-des\">";
                sameTypes += "<p class=\"promise\">" + item.title + "</p>";
                sameTypes += "<p class=\"car-info\">" + data.carInfo.sameTypeDates[i].replace("����","") + "����&nbsp;&nbsp;"+ data.carInfo.sameTypeMiles[i] +"</p>";
                sameTypes += "</div>";
                sameTypes += "<div class=\"right-des\">";

                if(item.flag6 == 1 && data.carInfo.currentDate < item.specialDatetime){
                    var spPrice = item.specialPrice + "";
                    sameTypes += "<p class=\"car-price\">"+ spPrice + "��</p>";
                } else {
                    var salePrice = item.salePrice + "";
                    sameTypes += "<p class=\"car-price\">"+ salePrice + "��</p>";
                }


                sameTypes += "<p class=\"release-date\">" + data.carInfo.sameTypePublishTimes[i] + "</p>";
                sameTypes += "</div>";
                sameTypes += "</div>";
                sameTypes += "</li>";

            });

            $("#carList3").append(sameTypes);
            $("#carList3").removeClass("dndn");
            $("#carList3").addClass("dbl");
        } else {
            $("#carList3").remove();
        }

        var samePrices = "";
        if(data.carInfo.carAndExtAndPics.samePriceRangeCarList != null && data.carInfo.carAndExtAndPics.samePriceRangeCarList.length > 0){
            $.each(data.carInfo.carAndExtAndPics.samePriceRangeCarList, function(i, item){
                samePrices += "<li class=\"car-item\">";
                samePrices += "<a href=" + data.carInfo.samePriceLinks[i] + " class=\"car-tit\">" + item.enterTrimmName + "</a>";
                if(item.flag3 == 1) {
                    samePrices +="<span class=\"authentication\">��</span>";
                }
                samePrices +="<div class=\"description\">";
                samePrices += "<div class=\"left-des\">";
                samePrices += "<p class=\"promise\">" + item.title + "</p>";
                samePrices += "<p class=\"car-info\">" + data.carInfo.samePriceDates[i].replace("����","") + "����&nbsp;&nbsp;"+ data.carInfo.samePriceMiles[i] +"</p>";
                samePrices += "</div>";
                samePrices += "<div class=\"right-des\">";

                if(item.flag6 == 1 && data.carInfo.currentDate < item.specialDatetime){
                    var spPrice = item.specialPrice + "";
                    samePrices += "<p class=\"car-price\">"+ spPrice + "��</p>";
                } else {
                    var salePrice = item.salePrice + "";
                    samePrices += "<p class=\"car-price\">"+ salePrice + "��</p>";
                }
                samePrices += "<p class=\"release-date\">" + data.carInfo.samePricePublishTimes[i] + "</p>";
                samePrices += "</div>";
                samePrices += "</div>";
                samePrices += "</li>";
            });
            $("#carList1").append(samePrices);
            $("#carList1").removeClass("dndn");
            $("#carList1").addClass("dbl");
        } else {
            $("#carList1").remove();
        }
        $("#recommend-cars").tabs('refresh');
    }});

}


function doAccusation(){
    var isSuccess = false;
    var carId = $("#defaultCarId").val();
    var accuType = document.getElementById("accuSel").value;
    if(!accuType || (accuType!=0 && accuType!=1 && accuType!=2 && accuType!=3 && accuType!=4 && accuType!=5&& accuType!=6 && accuType!=7  )){
        alert("�ٱ����ͱ���");
        return;
    }
    var accuText = document.getElementById("report-content").value;
    if(!accuText || accuText.length > 249){
        alert("��������");
        return;
    }

    var phone = document.getElementById("accuPhone").value;
    if(!isMobel(phone)){
        alert("��������ȷ���ֻ�����");
        return;
    }

    var type = 0;
    var url = "/interface/carinfo/accusation/?accuType="+accuType+"&accuText="+accuText+"&carId=" + carId + "&phone=" + phone;
    url=encodeURI(url);
    url=encodeURI(url);
    $.ajax({url:url, type:"post", async:false, success:function (data) {
        if(data.result == "success"){
            alert("�ɹ�");
            isSuccess = true;
            document.getElementById("accuSel").value = "-1";
            document.getElementById("report-content").value = "";
        }else{
            alert(data.result.msg);
        }
    }});
    return isSuccess;
}

function doSubmitsss(dealerId, carId){
    var isSuccess = false;
    var consulte = document.getElementById("message-content").value;
    var username = document.getElementById("message-name").value;
    var phone = document.getElementById("message-phone").value;
    if(!consulte.trim()){
        alert("��������ѯ����");
        return false;
    }else{
        if(consulte.trim().length > 500){
            alert("���������ѯ���ݹ���");
            return false;
        }
    }
    if(consulte == "�ף�����ͨ������ԤԼ��������ѯ�׼ۡ���ϵ���ң�������������������ϵ��ʽ���̼��յ�������Ϣ���ڵ�һʱ����ϵ����"){
        alert("��������������");
        return false;
    }
    if(!username.trim()){
        alert("��������������");
        return false;
    }else{
        if(username.trim().length > 50){
            alert("���������������");
            return false;
        }
    }
    if(!isMobel(phone)){
        alert("��������ȷ���ֻ�����");
        return false;
    }

    var type = 0;
    var param = "message.consulte="+consulte+"&message.consulteName="+username+"&message.consultePhone="+phone+"&message.flag="+type+"&message.dealerId=" + dealerId + "&message.carId=" + carId;
    var url = "/sccar/leavemessage/?"+param;
    url=encodeURI(url);
    url=encodeURI(url);
    $.ajax({url:url, type:"post", async:false, success:function (data) {
        var dataObj = eval("(" + data.result + ")");
        if(dataObj == 1){
            isSuccess = true;
            alert("���������Ѹ��ύ�����̻����������ĵȴ��ظ���");
            document.getElementById("message-content").value = "";
            document.getElementById("message-name").value = "";
            document.getElementById("message-phone").value = "";
        }
    }});
    return isSuccess;
}

function isMobel(value){
    if(/^13\d{9}$/g.test(value)||(/^15[0-9]\d{8}$/g.test(value))||
        (/^18[0-9]\d{8}$/g.test(value))){
        return true;
    }else{
        return false;
    }
}

function isEmail(value){
    var reg = new RegExp("^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+((\.[a-zA-Z0-9_-]{2,3}){1,2})$");
    if(reg.test(value)) {
        return true;
    }
    return false;
}



function doSuggest(){
    var isSuccess = false;
    var content = document.getElementById("suggest-content").value;
    var username = document.getElementById("suggest-name").value;
    var leaveSign = document.getElementById("suggest-leaveSign").value;
    if(!content.trim()){
        alert("��������ѯ����");
        return false;
    }else{
        if(content.trim().length > 500){
            alert("���������ѯ���ݹ���");
            return false;
        }
    }
    if(!username.trim()){
        alert("��������������");
        return false;
    }else{
        if(username.trim().length > 50){
            alert("���������������");
            return false;
        }
    }

    if(!isMobel(leaveSign) && !isEmail(leaveSign)){
        alert("��������ȷ���ֻ����������");
        return false;
    }

    var type = 0;
    var param = "content="+content+"&name="+username+"&leaveSign="+leaveSign;
    var url = "/sccar/suggest/?"+param;
    url=encodeURI(url);
    url=encodeURI(url);
    $.ajax({url:url, type:"post", async:false, success:function (data) {
        var dataObj = eval("(" + data.result + ")");
        if(dataObj.result == "success"){
            isSuccess = true;
            alert("��������Ѹ��ύ���������ĵȴ��ظ���");
            document.getElementById("suggest-content").value = "";
            document.getElementById("suggest-name").value = "";
            document.getElementById("suggest-leaveSign").value = "";
        } else {
            alert(data.result.msg);
        }

    }});
    return isSuccess;
}

