/*!
 * jQuery UI Widget @VERSION
 * http://jqueryui.com
 *
 * Copyright 2014 jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/jQuery.widget/
 */
(function( factory ) {
	if ( typeof define === "function" && define.amd ) {

		// AMD. Register as an anonymous module.
		define( [ "jquery" ], factory );
	} else {

		// Browser globals
		factory( jQuery );
	}
}(function( $ ) {

var widget_uuid = 0,
	widget_slice = Array.prototype.slice;

$.cleanData = (function( orig ) {
	return function( elems ) {
		var events, elem, i;
		for ( i = 0; (elem = elems[i]) != null; i++ ) {
			try {

				// Only trigger remove when necessary to save time
				events = $._data( elem, "events" );
				if ( events && events.remove ) {
					$( elem ).triggerHandler( "remove" );
				}

			// http://bugs.jquery.com/ticket/8235
			} catch( e ) {}
		}
		orig( elems );
	};
})( $.cleanData );

/**
 * $.ui.widget 部件库（Widget Factory）<br/>
 * 使用与所有 jQuery UI 小部件相同的抽象化来创建有状态的 jQuery 插件。<br/>
 * 您可以使用 $.Widget 对象作为要继承的基础，或者可以明确地从现有的 jQuery UI 或第三方控件，从头开始创建新的小部件。
 * 定义一个带有相同名称的小部件来继承基础部件，甚至允许您适当地扩展小部件。<br/>
 *
 * jQuery UI 中包含许多保持状态的小部件，因此比典型的 jQuery 插件稍有不同的使用模式。
 * 所有的jQuery UI 小部件使用相同的模式，这是由部件库（Widget Factory）定义的。
 * 所以，只要您学会使用其中一个，您就知道如何使用其他的小部件（Widget）。<br/>
 * 
 * @class widget
 * @module widget
 * @constructor
 * @namespace ui
 */

/**
 * 使用与所有 jQuery UI 小部件相同的抽象化来创建有状态的 jQuery 插件。
 * @method widget
 * @param  {String} name      要创建的小部件名称，包括命名空间。
 * @param  {Function} base      要继承的基础小部件。必须是一个可以使用 `new` 关键词实例化的构造函数。默认为 jQuery.Widget。
 * @param  {PlainObject} prototype 要作为小部件原型使用的对象。
 * @return {[type]}           [description]
 */
$.widget = function( name, base, prototype ) {
	var fullName, existingConstructor, constructor, basePrototype,
		// proxiedPrototype allows the provided prototype to remain unmodified
		// so that it can be used as a mixin for multiple widgets (#8876)
		proxiedPrototype = {},
		namespace = name.split( "." )[ 0 ];

	name = name.split( "." )[ 1 ];
	fullName = namespace + "-" + name;

	if ( !prototype ) {
		prototype = base;
		base = $.Widget;
	}

	// create selector for plugin
	$.expr[ ":" ][ fullName.toLowerCase() ] = function( elem ) {
		return !!$.data( elem, fullName );
	};

	$[ namespace ] = $[ namespace ] || {};
	existingConstructor = $[ namespace ][ name ];
	constructor = $[ namespace ][ name ] = function( options, element ) {
		// allow instantiation without "new" keyword
		if ( !this._createWidget ) {
			return new constructor( options, element );
		}

		// allow instantiation without initializing for simple inheritance
		// must use "new" keyword (the code above always passes args)
		if ( arguments.length ) {
			this._createWidget( options, element );
		}
	};
	// extend with the existing constructor to carry over any static properties
	$.extend( constructor, existingConstructor, {
		version: prototype.version,
		// copy the object used to create the prototype in case we need to
		// redefine the widget later
		_proto: $.extend( {}, prototype ),
		// track widgets that inherit from this widget in case this widget is
		// redefined after a widget inherits from it
		_childConstructors: []
	});

	basePrototype = new base();
	// we need to make the options hash a property directly on the new instance
	// otherwise we'll modify the options hash on the prototype that we're
	// inheriting from
	basePrototype.options = $.widget.extend( {}, basePrototype.options );
	$.each( prototype, function( prop, value ) {
		if ( !$.isFunction( value ) ) {
			proxiedPrototype[ prop ] = value;
			return;
		}
		proxiedPrototype[ prop ] = (function() {
			var _super = function() {
					return base.prototype[ prop ].apply( this, arguments );
				},
				_superApply = function( args ) {
					return base.prototype[ prop ].apply( this, args );
				};
			return function() {
				var __super = this._super,
					__superApply = this._superApply,
					returnValue;

				this._super = _super;
				this._superApply = _superApply;

				returnValue = value.apply( this, arguments );

				this._super = __super;
				this._superApply = __superApply;

				return returnValue;
			};
		})();
	});
	constructor.prototype = $.widget.extend( basePrototype, {
		// TODO: remove support for widgetEventPrefix
		// always use the name + a colon as the prefix, e.g., draggable:start
		// don't prefix for widgets that aren't DOM-based
		widgetEventPrefix: existingConstructor ? (basePrototype.widgetEventPrefix || name) : name
	}, proxiedPrototype, {
		constructor: constructor,
		namespace: namespace,
		widgetName: name,
		widgetFullName: fullName
	});

	// If this widget is being redefined then we need to find all widgets that
	// are inheriting from it and redefine all of them so that they inherit from
	// the new version of this widget. We're essentially trying to replace one
	// level in the prototype chain.
	if ( existingConstructor ) {
		$.each( existingConstructor._childConstructors, function( i, child ) {
			var childPrototype = child.prototype;

			// redefine the child widget using the same prototype that was
			// originally used, but inherit from the new version of the base
			$.widget( childPrototype.namespace + "." + childPrototype.widgetName, constructor, child._proto );
		});
		// remove the list of existing child constructors from the old constructor
		// so the old child constructors can be garbage collected
		delete existingConstructor._childConstructors;
	} else {
		base._childConstructors.push( constructor );
	}

	$.widget.bridge( name, constructor );

	return constructor;
};

$.widget.extend = function( target ) {
	var input = widget_slice.call( arguments, 1 ),
		inputIndex = 0,
		inputLength = input.length,
		key,
		value;
	for ( ; inputIndex < inputLength; inputIndex++ ) {
		for ( key in input[ inputIndex ] ) {
			value = input[ inputIndex ][ key ];
			if ( input[ inputIndex ].hasOwnProperty( key ) && value !== undefined ) {
				// Clone objects
				if ( $.isPlainObject( value ) ) {
					target[ key ] = $.isPlainObject( target[ key ] ) ?
						$.widget.extend( {}, target[ key ], value ) :
						// Don't extend strings, arrays, etc. with objects
						$.widget.extend( {}, value );
				// Copy everything else by reference
				} else {
					target[ key ] = value;
				}
			}
		}
	}
	return target;
};

/**
 * jQuery.widget.bridge() 方法是 jQuery 部件库（Widget Factory） 的一部分。它扮演着由 $.widget() 创建的对象和 jQuery API 之间的中介。<br/>
 * $.widget.bridge() 做如下事情：<br/>
 * 连接一个常规的 JavaScript 构造函数到 jQuery API。<br/>
 * 自动创建对象实例，并存储在元素的 $.data 缓存内。<br/>
 * 允许调用公有方法。<br/>
 * 防止调用私有方法。<br/>
 * 防止在未初始化的对象上调用方法。<br/>
 * 防止多个初始化。<br/>
 * @module widget
 * @submodule bridge 
 * @method bridge
 * @param  {String} name   要创建的插件名称。
 * @param  {Function} object 当插件被调用时要实例化的对象。
 * @return {[type]}        [description]
 */
$.widget.bridge = function( name, object ) {
	var fullName = object.prototype.widgetFullName || name;
	$.fn[ name ] = function( options ) {
		var isMethodCall = typeof options === "string",
			args = widget_slice.call( arguments, 1 ),
			returnValue = this;

		// allow multiple hashes to be passed on init
		options = !isMethodCall && args.length ?
			$.widget.extend.apply( null, [ options ].concat(args) ) :
			options;

		if ( isMethodCall ) {
			this.each(function() {
				var methodValue,
					instance = $.data( this, fullName );
				if ( options === "instance" ) {
					returnValue = instance;
					return false;
				}
				if ( !instance ) {
					return $.error( "cannot call methods on " + name + " prior to initialization; " +
						"attempted to call method '" + options + "'" );
				}
				if ( !$.isFunction( instance[options] ) || options.charAt( 0 ) === "_" ) {
					return $.error( "no such method '" + options + "' for " + name + " widget instance" );
				}
				methodValue = instance[ options ].apply( instance, args );
				if ( methodValue !== instance && methodValue !== undefined ) {
					returnValue = methodValue && methodValue.jquery ?
						returnValue.pushStack( methodValue.get() ) :
						methodValue;
					return false;
				}
			});
		} else {
			this.each(function() {
				var instance = $.data( this, fullName );
				if ( instance ) {
					instance.option( options || {} );
					if ( instance._init ) {
						instance._init();
					}
				} else {
					$.data( this, fullName, new object( options, this ) );
				}
			});
		}

		return returnValue;
	};
};

$.Widget = function( /* options, element */ ) {};
$.Widget._childConstructors = [];

$.Widget.prototype = {
	/**
	 * 小部件的名称。对于 $.widget( "myNamespace.myWidget", {} )，widgetName 将是 "myWidget"。
	 * @property widgetName
	 * @type {String}
	 */
	widgetName: "widget", 
	/**
	 * 添加到小部件事件名称的前缀。
	 * 例如，可拖拽小部件（Draggable Widget） 的 widgetEventPrefix 是 "drag"，因此当创建一个 draggable 时，事件的名称是 "dragcreate"。
	 * 默认情况下，小部件的 widgetEventPrefix 是它的名称。
	 * 
	 *
	 * @property widgetEventPrefix
	 * @deprecated 注意：该属性已被废弃，将在以后的版本中非常。事件名称将被改为 widgetName:eventName （例如 "draggable:create"）。
	 * @type {String}
	 */
	widgetEventPrefix: "", 
	/**
	 * 当构造小部件实例未提供元素时要使用的元素。
	 * 例如，由于进度条的 defaultElement 是 "&lt;div &gt;"，
	 * $.ui.progressbar({ value: 50 }) 在一个新建的 &lt;div&gt; 上实例化进度条小部件实例。
	 * 
	 * @property defaultElement
	 * @type {String}
	 * @default '<div>'
	 */
	defaultElement: "<div>",
	/**
	 * 一个包含小部件当前使用选项的对象。
	 * 在实例化时，用户提供的任何选项将会自动与 $.myNamespace.myWidget.prototype.options 中定义的默认值合并。用户指定的选项会覆盖默认值。
	 * 
	 * @property options
	 * @type {Object}
	 */
	options: {
		disabled: false, //如果设置为 true，则禁用该小部件。

		// callbacks
		create: null // 当小部件被创建时触发。
	},
	_createWidget: function( options, element ) {
		element = $( element || this.defaultElement || this )[ 0 ];
		//一个 jQuery 对象，包含用于实例化小部件的 元素。
		//如果您选择多个元素并调用 .myWidget()，将为每个元素创建一个单独的小部件实例。因此，该属性总是包含一个元素。
		this.element = $( element ); 
		//一个表示控件标识符的唯一整数。
		this.uuid = widget_uuid++;
		this.eventNamespace = "." + this.widgetName + this.uuid;
		this.options = $.widget.extend( {},
			this.options,
			this._getCreateOptions(),
			options );

		this.bindings = $();
		this.hoverable = $();
		this.focusable = $();

		if ( element !== this ) {
			$.data( element, this.widgetFullName, this );
			this._on( true, this.element, {
				remove: function( event ) {
					if ( event.target === element ) {
						this.destroy();
					}
				}
			});
			this.document = $( element.style ?
				// element within the document
				element.ownerDocument :
				// element is window or document
				element.document || element );
			this.window = $( this.document[0].defaultView || this.document[0].parentWindow );
		}

		this._create();
		this._trigger( "create", null, this._getCreateEventData() );
		this._init();
	},
	/**
	 * 该方法允许小部件在初始化期间为定义选项定义一个自定义的方法。用户提供的选项会覆盖该方法返回的选项，即会覆盖默认的选项。
	 * @method _getCreateOptions
	 * @private
	 * @returns {Object}
	 * @example
	 *	//让小部件元素的 id 属性作为选项可用。
	 *	_getCreateOptions: function() {
	 *		return { id: this.element.attr( "id" ) };
	 *	}
	 *	
	 */
	_getCreateOptions: $.noop,
	/**
	 * 所有的小部件触发 create 事件。默认情况下，事件中不提供任何的数据，但是该方法会返回一个对象，作为 create 事件的数据被传递。
	 * @method _getCreateEventData
	 * @private
	 * @returns {Object}
	 * @example
	 *	//向 create 事件处理程序传递小部件的选项，作为参数。
	 *	_getCreateEventData: function() {
	 *		return this.options;
	 *	}
	 *	
	 */
	_getCreateEventData: $.noop,
	/**
	 * _create() 方法是小部件的构造函数。没有参数，但是 this.element 和 this.options 已经设置。
	 * @method _create
	 * @returns {jQuery (plugin only)}
	 * @private
	 * @example
	 *	//基于一个选项设置小部件元素的背景颜色。
	 *	_create: function() {
	 *		this.element.css( "background-color", this.options.color );
	 *	}
	 *	
	 */
	_create: $.noop,
	/**
	 * 小部件初始化的理念与创建不同。任何时候不带参数的调用插件或者只带一个选项哈希的调用插件，初始化小部件。当小部件被创建时会包含这个方法。<br/>
	 * 注释：如果存在不带参数成功调用小部件时要执行的逻辑动作，初始化只能在这时处理。
	 * @method _init
	 * @returns {jQuery (plugin only)}
	 * @private
	 * @example
	 *	//如果设置了 autoOpen 选项，则调用 open() 方法。
	 *	_init: function() {
	 *		if ( this.options.autoOpen ) {
	 *			this.open();
	 *		}
	 *	}
	 *	
	 */
	_init: $.noop,
	/**
	 * 完全移除小部件功能。这会把元素返回到它的预初始化状态。
	 * @method destroy
	 * @returns {jQuery (plugin only)}
	 * @example
	 *	//当点击小部件的任意锚点时销毁小部件。
	 *	this._on( this.element, {
	 *		"click a": function( event ) {
	 *			event.preventDefault();
	 *			this.destroy();
	 *		}
	 *	});
	 *	
	 */
	destroy: function() {
		this._destroy();
		// we can probably remove the unbind calls in 2.0
		// all event bindings should go through this._on()
		this.element
			.unbind( this.eventNamespace )
			.removeData( this.widgetFullName )
			// support: jquery <1.6.3
			// http://bugs.jquery.com/ticket/9413
			.removeData( $.camelCase( this.widgetFullName ) );
		this.widget()
			.unbind( this.eventNamespace )
			.removeAttr( "aria-disabled" )
			.removeClass(
				this.widgetFullName + "-disabled " +
				"ui-state-disabled" );

		// clean up events and states
		this.bindings.unbind( this.eventNamespace );
		this.hoverable.removeClass( "ui-state-hover" );
		this.focusable.removeClass( "ui-state-focus" );
	},
	/**
	 * 公共的 destroy() 方法清除所有的公共数据、事件等等。代表了定制、指定小部件、清理的 _destroy()。
	 * @method _destroy
	 * @returns {jQuery (plugin only)}
	 * @private
	 * @example
	 *	//当小部件被销毁时，从小部件的元素移除一个 class。
	 *	_destroy: function() {
	 *		this.element.removeClass( "my-widget" );
	 *	}
	 *	
	 */
	_destroy: $.noop,
	/**
	 * 返回一个包含原始元素或其他相关的生成元素的 jQuery 对象。
	 * @method widget
	 * @return {jQuery} [description]
	 * @example
	 *	//当创建小部件时，在小部件的原始元素周围放置一个红色的边框。
	 *	_create: function() {
	 *		this.widget().css( "border", "2px solid red" );
	 *	} 
	 */
	widget: function() {
		return this.element;
	},
	/**
	 * 设置与指定的 key 关联的小部件选项的值。
	 * @method option
	 * @param  {String} key   要设置的选项的名称。
	 * @param  {Object} value 要为选项设置的值。
	 * @return {jQuery (plugin only)}       [description]
	 * @example
	 *	//设置 width 选项为 500。
	 *	this.option( "width", 500 );
	 *	
	 */
	option: function( key, value ) {
		var options = key,
			parts,
			curOption,
			i;

		if ( arguments.length === 0 ) {
			// don't return a reference to the internal hash
			return $.widget.extend( {}, this.options );
		}

		if ( typeof key === "string" ) {
			// handle nested keys, e.g., "foo.bar" => { foo: { bar: ___ } }
			options = {};
			parts = key.split( "." );
			key = parts.shift();
			if ( parts.length ) {
				curOption = options[ key ] = $.widget.extend( {}, this.options[ key ] );
				for ( i = 0; i < parts.length - 1; i++ ) {
					curOption[ parts[ i ] ] = curOption[ parts[ i ] ] || {};
					curOption = curOption[ parts[ i ] ];
				}
				key = parts.pop();
				if ( arguments.length === 1 ) {
					return curOption[ key ] === undefined ? null : curOption[ key ];
				}
				curOption[ key ] = value;
			} else {
				if ( arguments.length === 1 ) {
					return this.options[ key ] === undefined ? null : this.options[ key ];
				}
				options[ key ] = value;
			}
		}

		this._setOptions( options );

		return this;
	},
	/**
	 * 当调用 option() 方法时调用，无论以什么形式调用 option()。如果您要根据多个选项的改变而改变处理器密集型，重载该方法是很有用的。
	 * @method  _setOptions
	 * @param   {Object}    options 为选项设置的值。
	 * @private
	 * @example
	 *	//如果小部件的 height 或 width 选项改变，调用 resize 方法。
	 *	_setOptions: function( options ) {
	 *		var that = this,
	 *	 	resize = false;
 
 	 *		$.each( options, function( key, value ) {
	 *			that._setOption( key, value );
	 *			if ( key === "height" || key === "width" ) {
	 *				resize = true;
	 *			}
	 *		});
 
	 *		if ( resize ) {
	 *			this.resize();
	 *		}
	 *	}
	 */
	_setOptions: function( options ) {
		var key;

		for ( key in options ) {
			this._setOption( key, options[ key ] );
		}

		return this;
	},
	/**
	 * 为每个独立的选项调用 _setOptions() 方法。小部件状态随着改变而更新。
	 * @method  _setOption
	 * @param   {String}   key   要设置的选项名称。
	 * @param   {Object}   value 为选项设置的值。
	 * @example
	 *	//当小部件的 height 或 width 选项改变时，更新小部件的元素。
	 *	_setOption: function( key, value ) {
	 *		if ( key === "width" ) {
	 *			this.element.width( value );
	 *		}
	 *		if ( key === "height" ) {
	 *			this.element.height( value );
	 *		}
	 *		this._super( key, value );
	 *	}
	 * @private
	 */
	_setOption: function( key, value ) {
		this.options[ key ] = value;

		if ( key === "disabled" ) {
			this.widget()
				.toggleClass( this.widgetFullName + "-disabled", !!value );

			// If the widget is becoming disabled, then nothing is interactive
			if ( value ) {
				this.hoverable.removeClass( "ui-state-hover" );
				this.focusable.removeClass( "ui-state-focus" );
			}
		}

		return this;
	},
	/**
	 * 启用小部件。
	 * @method enable
	 * @returns {jQuery (plugin only)}
	 * @example
	 *	//当点击小部件的任意锚点时启用小部件。
	 *	this._on( this.element, {
	 *		"click a": function( event ) {
	 *			event.preventDefault();
	 *			this.enable();
	 *		}
	 *	});
	 *	
	 */
	enable: function() {
		return this._setOptions({ disabled: false });
	},
	/**
	 * 禁用小部件。
	 * @method disable
	 * @returns {jQuery (plugin only)}
	 * @example
	 *	//当点击小部件的任意锚点时禁用小部件。
	 *	this._on( this.element, {
	 *		"click a": function( event ) {
	 *			event.preventDefault();
	 *			this.disable();
	 *		}
	 *	});
	 *	
	 */
	disable: function() {
		return this._setOptions({ disabled: true });
	},
	/**
	 * 授权通过事件名称内的选择器被支持，例如 "click .foo"。_on() 方法提供了一些直接事件绑定的好处：<br/>
	 * 保持处理程序内适当的 this 上下文。<br/>
	 * 自动处理禁用的部件：如果小部件被禁用或事件发生在带有 ui-state-disabled class 的元素上，则不调用事件处理程序。
	 * 可以被 suppressDisabledCheck 参数重写。<br/>
	 * 事件处理程序会自动添加命名空间，在销毁时会自动清理。
	 * @method  _on
	 * @param   {Boolean} [suppressDisabledCheck=false] 是否要绕过禁用的检查。
	 * @param   {jQuery} element               要绑定事件处理程序的元素。如果未提供元素，this.element 用于未授权的事件，widget 元素 用于授权的事件。
	 * @param   {Object} handlers              一个 map，其中字符串键代表事件类型，可选的选择器用于授权，值代表事件调用的处理函数。
	 * @return  {jQuery (plugin only)}                       [description]
	 * @private
	 * @example
	 *	//放置小部件元素内所有被点击的链接的默认行为。
	 *	this._on( this.element, {
	 *		"click a": function( event ) {
	 *			event.preventDefault();
	 *		}
	 *	});
	 *	
	 */
	_on: function( suppressDisabledCheck, element, handlers ) {
		var delegateElement,
			instance = this;

		// no suppressDisabledCheck flag, shuffle arguments
		if ( typeof suppressDisabledCheck !== "boolean" ) {
			handlers = element;
			element = suppressDisabledCheck;
			suppressDisabledCheck = false;
		}

		// no element argument, shuffle and use this.element
		if ( !handlers ) {
			handlers = element;
			element = this.element;
			delegateElement = this.widget();
		} else {
			element = delegateElement = $( element );
			this.bindings = this.bindings.add( element );
		}

		$.each( handlers, function( event, handler ) {
			function handlerProxy() {
				// allow widgets to customize the disabled handling
				// - disabled as an array instead of boolean
				// - disabled class as method for disabling individual parts
				if ( !suppressDisabledCheck &&
						( instance.options.disabled === true ||
							$( this ).hasClass( "ui-state-disabled" ) ) ) {
					return;
				}
				return ( typeof handler === "string" ? instance[ handler ] : handler )
					.apply( instance, arguments );
			}

			// copy the guid so direct unbinding works
			if ( typeof handler !== "string" ) {
				handlerProxy.guid = handler.guid =
					handler.guid || handlerProxy.guid || $.guid++;
			}

			var match = event.match( /^([\w:-]*)\s*(.*)$/ ),
				eventName = match[1] + instance.eventNamespace,
				selector = match[2];
			if ( selector ) {
				delegateElement.delegate( selector, eventName, handlerProxy );
			} else {
				element.bind( eventName, handlerProxy );
			}
		});
	},
	/**
	 * 从指定的元素取消绑定事件处理程序。
	 * @method  _off
	 * @param   {jQuery} element   要取消绑定事件处理程序的元素。不像 _on() 方法，_off() 方法中元素是必需的。
	 * @param   {String} eventName 一个或多个空格分隔的事件类型。
	 * @return  {jQuery (plugin only)}           [description]
	 * @private
	 * @example
	 *	//从小部件的元素上取消绑定所有 click 事件。
	 *	this._off( this.element, "click" );
	 *	
	 */
	_off: function( element, eventName ) {
		eventName = (eventName || "").split( " " ).join( this.eventNamespace + " " ) +
			this.eventNamespace;
		element.unbind( eventName ).undelegate( eventName );

		// Clear the stack to avoid memory leaks (#10056)
		this.bindings = $( this.bindings.not( element ).get() );
		this.focusable = $( this.focusable.not( element ).get() );
		this.hoverable = $( this.hoverable.not( element ).get() );
	},
	/**
	 * 在指定延迟后调用提供的函数。保持 this 上下文正确。本质上是 setTimeout()。
使用 clearTimeout() 返回超时 ID。
	 * @method  _delay
	 * @param   {Function | String} handler 要调用的函数。也可以是小部件上方法的名称。
	 * @param   {Number} delay   调用函数前等待的毫秒数，默认为 0。
	 * @return  {Number}         [description]
	 * @example
	 *	//100 毫秒后在小部件上调用 _foo() 方法。
	 *	this._delay( this._foo, 100 );
	 * @private
	 */
	_delay: function( handler, delay ) {
		function handlerProxy() {
			return ( typeof handler === "string" ? instance[ handler ] : handler )
				.apply( instance, arguments );
		}
		var instance = this;
		return setTimeout( handlerProxy, delay || 0 );
	},
	/**
	 * 建立悬浮在元素上时要应用 ui-state-hover class 的 element。事件处理程序在销毁时自动清理。
	 * @method  _hoverable
	 * @param   {jQuery}   element 要应用 hoverable 行为的元素。
	 * @return  {jQuery (plugin only)}           [description]
	 * @private
	 * @example
	 *	//当悬浮在元素上时，向元素内所有的 div 应用 hoverable 样式。
	 *	this._hoverable( this.element.find( "div" ) );
	 */
	_hoverable: function( element ) {
		this.hoverable = this.hoverable.add( element );
		this._on( element, {
			mouseenter: function( event ) {
				$( event.currentTarget ).addClass( "ui-state-hover" );
			},
			mouseleave: function( event ) {
				$( event.currentTarget ).removeClass( "ui-state-hover" );
			}
		});
	},
	/**
	 * 建立聚焦在元素上时要应用 ui-state-focus class 的 element。
	 * @method  _focusable
	 * @param   {jQuery}   element 要应用 focusable 行为的元素。
	 * @return  {[type]}           [description]
	 * @private
	 * @example
	 *	//向小部件内的一组元素应用 focusable 样式：
	 *	this._focusable( this.element.find( ".my-items" ) );
	 */
	_focusable: function( element ) {
		this.focusable = this.focusable.add( element );
		this._on( element, {
			focusin: function( event ) {
				$( event.currentTarget ).addClass( "ui-state-focus" );
			},
			focusout: function( event ) {
				$( event.currentTarget ).removeClass( "ui-state-focus" );
			}
		});
	},
	/**
	 * 触发一个事件及其相关的回调。带有该名称的选项与作为回调被调用的类型相等。<br/>
	 * 事件名称是小部件名称和类型的小写字母串。<br/>
	 * 注释：当提供数据时，您必须提供所有三个参数。如果没有传递事件，则传递 null。<br/>
	 * 如果默认行为是阻止的，则返回 false，否则返回 true。当处理程序返回 false 时或调用 event.preventDefault() 时，则阻止默认行为发生。<br/>
	 * @method  _trigger
	 * @param   {String} type  type 应该匹配回调选项的名称。完整的事件类型会自动生成。
	 * @param   {Event} event 导致该事件发生的原始事件，想听众提供上下文时很有用。
	 * @param   {Object} data  一个与事件相关的数据哈希。
	 * @return  {Boolean}       [description]
	 * @private
	 * @example
	 *	//当按下一个键时，触发 search 事件。
	 *	this._on( this.element, {
	 *		keydown: function( event ) {
	 *			// Pass the original event so that the custom search event has
	 *			// useful information, such as keyCode
	 *			this._trigger( "search", event, {
	 *				// Pass additional information unique to this event
	 *				value: this.element.val()
	 *			});
	 *		}
	 *	});
	 *	
	 */
	_trigger: function( type, event, data ) {
		var prop, orig,
			callback = this.options[ type ];

		data = data || {};
		event = $.Event( event );
		event.type = ( type === this.widgetEventPrefix ?
			type :
			this.widgetEventPrefix + type ).toLowerCase();
		// the original event may come from any element
		// so we need to reset the target on the new event
		event.target = this.element[ 0 ];

		// copy original event properties over to the new event
		orig = event.originalEvent;
		if ( orig ) {
			for ( prop in orig ) {
				if ( !( prop in event ) ) {
					event[ prop ] = orig[ prop ];
				}
			}
		}

		this.element.trigger( event, data );
		return !( $.isFunction( callback ) &&
			callback.apply( this.element[0], [ event ].concat( data ) ) === false ||
			event.isDefaultPrevented() );
	}
};

$.each( { show: "fadeIn", hide: "fadeOut" }, function( method, defaultEffect ) {
	$.Widget.prototype[ "_" + method ] = function( element, options, callback ) {
		if ( typeof options === "string" ) {
			options = { effect: options };
		}
		var hasOptions,
			effectName = !options ?
				method :
				options === true || typeof options === "number" ?
					defaultEffect :
					options.effect || defaultEffect;
		options = options || {};
		if ( typeof options === "number" ) {
			options = { duration: options };
		}
		hasOptions = !$.isEmptyObject( options );
		options.complete = callback;
		if ( options.delay ) {
			element.delay( options.delay );
		}
		if ( hasOptions && $.effects && $.effects.effect[ effectName ] ) {
			element[ method ]( options );
		} else if ( effectName !== method && element[ effectName ] ) {
			element[ effectName ]( options.duration, options.easing, callback );
		} else {
			element.queue(function( next ) {
				$( this )[ method ]();
				if ( callback ) {
					callback.call( element[ 0 ] );
				}
				next();
			});
		}
	};
});

return $.widget;

}));
