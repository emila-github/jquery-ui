/*!
 * jQuery UI Mouse @VERSION
 * http://jqueryui.com
 *
 * Copyright 2014 jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/mouse/
 */
(function( factory ) {
	if ( typeof define === "function" && define.amd ) {

		// AMD. Register as an anonymous module.
		define([
			"jquery",
			"./widget"
		], factory );
	} else {

		// Browser globals
		factory( jQuery );
	}
}(function( $ ) {

var mouseHandled = false;
$( document ).mouseup( function() {
	mouseHandled = false;
});

/**
 * $.ui.mouse 鼠标交互<br/>
 * 与 jQuery.Widget 相似，鼠标交互的目的不是直接使用。
 * 这是一个纯粹给其他小部件继承用的基础层。该页面有添加到 jQuery.Widget 的文档，但是它包含了不能被覆盖的内部方法。
 * 公共的 API 是 _mouseStart()、_mouseDrag()、_mouseStop() 和 _mouseCapture()。
 * 
 * @class mouse
 * @module mouse
 * @requires widget
 * @constructor
 * @namespace ui
 */

return $.widget("ui.mouse", {
	version: "@VERSION",
	/**
	 * 默认的鼠标交互 options
	 * @property options
	 * @type {Object}
	 * @final
	 * @example
	 *	//初始化带有指定 cancel 选项的 mouse：
	 *	$( ".selector" ).mouse({ cancel: ".title" });
	 *	
	 *	//在初始化后，获取或设置 cancel 选项：
	 *	// getter
	 *	var cancel = $( ".selector" ).mouse( "option", "cancel" );
	 *	// setter
	 *	$( ".selector" ).mouse( "option", "cancel", ".title" );
	 * 
	 */
	options: {
		cancel: "input,textarea,button,select,option",  //防止从指定的元素上开始交互。
		distance: 1, //鼠标按下后交互开始前鼠标必须移动的距离，以像素计。该选项可用于防止点击在一个元素上时不必要的交互。
		delay: 0  //鼠标按下后直至交互开始的事件，以毫秒计。该选项可用于防止点击在一个元素上时不必要的交互。
	},
    /**
     * 初始化交互事件处理程序。这必须调用来自扩展的小部件的 _create() 方法。
     * @method  _mouseInit
     * @private
     */
	_mouseInit: function() {
		var that = this;

		this.element
			.bind("mousedown." + this.widgetName, function(event) {
				return that._mouseDown(event);
			})
			.bind("click." + this.widgetName, function(event) {
				if (true === $.data(event.target, that.widgetName + ".preventClickEvent")) {
					$.removeData(event.target, that.widgetName + ".preventClickEvent");
					event.stopImmediatePropagation();
					return false;
				}
			});

		this.started = false;
	},

	// TODO: make sure destroying one instance of mouse doesn't mess with
	// other instances of mouse
    /**
     * 销毁交互事件处理程序。这必须调用来自扩展的小部件的 _destroy() 方法。
     * @method  _mouseDestroy
     * @private
     */
	_mouseDestroy: function() {
		this.element.unbind("." + this.widgetName);
		if ( this._mouseMoveDelegate ) {
			this.document
				.unbind("mousemove." + this.widgetName, this._mouseMoveDelegate)
				.unbind("mouseup." + this.widgetName, this._mouseUpDelegate);
		}
	},
    /**
     * 处理交互的开始。确认与主要的鼠标按钮关联的事件，确保 delay 与 distance 在交互启动之前得到满足。
     * 当交互已经准备开始，为要处理的扩展小部件调用 _mouseStart 方法。
     * @method  _mouseDown
     * @param event
     * @returns {boolean}
     * @private
     */
	_mouseDown: function(event) {
		// don't let more than one widget handle mouseStart
		if ( mouseHandled ) {
			return;
		}

		this._mouseMoved = false;

		// we may have missed mouseup (out of window)
		(this._mouseStarted && this._mouseUp(event));

		this._mouseDownEvent = event;

		var that = this,
			btnIsLeft = (event.which === 1),
			// event.target.nodeName works around a bug in IE 8 with
			// disabled inputs (#7620)
			elIsCancel = (typeof this.options.cancel === "string" && event.target.nodeName ? $(event.target).closest(this.options.cancel).length : false);
		if (!btnIsLeft || elIsCancel || !this._mouseCapture(event)) {
			return true;
		}

		this.mouseDelayMet = !this.options.delay;
		if (!this.mouseDelayMet) {
			this._mouseDelayTimer = setTimeout(function() {
				that.mouseDelayMet = true;
			}, this.options.delay);
		}

		if (this._mouseDistanceMet(event) && this._mouseDelayMet(event)) {
			this._mouseStarted = (this._mouseStart(event) !== false);
			if (!this._mouseStarted) {
				event.preventDefault();
				return true;
			}
		}

		// Click event may never have fired (Gecko & Opera)
		if (true === $.data(event.target, this.widgetName + ".preventClickEvent")) {
			$.removeData(event.target, this.widgetName + ".preventClickEvent");
		}

		// these delegates are required to keep context
		this._mouseMoveDelegate = function(event) {
			return that._mouseMove(event);
		};
		this._mouseUpDelegate = function(event) {
			return that._mouseUp(event);
		};

		this.document
			.bind( "mousemove." + this.widgetName, this._mouseMoveDelegate )
			.bind( "mouseup." + this.widgetName, this._mouseUpDelegate );

		event.preventDefault();

		mouseHandled = true;
		return true;
	},
    /**
     * 处理交互的每个移动。为要处理的扩展小部件调用 _mouseDrag 方法。
     * @method  _mouseMove
     * @param event
     * @returns {*}
     * @private
     */
	_mouseMove: function(event) {
		// Only check for mouseups outside the document if you've moved inside the document
		// at least once. This prevents the firing of mouseup in the case of IE<9, which will
		// fire a mousemove event if content is placed under the cursor. See #7778
		// Support: IE <9
		if ( this._mouseMoved ) {
			// IE mouseup check - mouseup happened when mouse was out of window
			if ($.ui.ie && ( !document.documentMode || document.documentMode < 9 ) && !event.button) {
				return this._mouseUp(event);

			// Iframe mouseup check - mouseup occurred in another document
			} else if ( !event.which ) {
				return this._mouseUp( event );
			}
		}

		if ( event.which || event.button ) {
			this._mouseMoved = true;
		}

		if (this._mouseStarted) {
			this._mouseDrag(event);
			return event.preventDefault();
		}

		if (this._mouseDistanceMet(event) && this._mouseDelayMet(event)) {
			this._mouseStarted =
				(this._mouseStart(this._mouseDownEvent, event) !== false);
			(this._mouseStarted ? this._mouseDrag(event) : this._mouseUp(event));
		}

		return !this._mouseStarted;
	},
    /**
     * 处理交互的结束。为要处理的扩展小部件调用 _mouseStop 方法。
     * @method  _mouseUp
     * @param event
     * @returns {boolean}
     * @private
     */
	_mouseUp: function(event) {
		this.document
			.unbind( "mousemove." + this.widgetName, this._mouseMoveDelegate )
			.unbind( "mouseup." + this.widgetName, this._mouseUpDelegate );

		if (this._mouseStarted) {
			this._mouseStarted = false;

			if (event.target === this._mouseDownEvent.target) {
				$.data(event.target, this.widgetName + ".preventClickEvent", true);
			}

			this._mouseStop(event);
		}

		mouseHandled = false;
		return false;
	},
    /**
     * 决定 distance 选项是否满足当前交互。
     * @method  _mouseDistanceMet
     * @param event
     * @returns {boolean}
     * @private
     */
	_mouseDistanceMet: function(event) {
		return (Math.max(
				Math.abs(this._mouseDownEvent.pageX - event.pageX),
				Math.abs(this._mouseDownEvent.pageY - event.pageY)
			) >= this.options.distance
		);
	},
    /**
     * 决定 delay 选项是否满足当前交互。
     * @method  _mouseDelayMet
     * @returns {boolean|*|mouseDelayMet}
     * @private
     */
	_mouseDelayMet: function(/* event */) {
		return this.mouseDelayMet;
	},

	// These are placeholder methods, to be overriden by extending plugin
    /**
     * 扩展小部件应实现一个 _mouseStart() 方法，来处理交互的开始。该方法将接收与交互开始相关联的鼠标事件。
     * @method  _mouseStart
     * @private
     */
	_mouseStart: function(/* event */) {},
    /**
     * 扩展小部件应实现一个 _mouseDrag() 方法，来处理交互的每个移动。该方法将接收与鼠标移动相关联的鼠标事件。
     * @method  _mouseDrag
     * @private
     */
	_mouseDrag: function(/* event */) {},
    /**
     * 扩展小部件应实现一个 _mouseStop() 方法，来处理交互的结束。该方法将接收与交互结束相关联的鼠标事件。
     * @method  _mouseStop
     * @private
     */
	_mouseStop: function(/* event */) {},
    /**
     * 决定交互是否应该基于交互的事件目标开始。默认的实现总是返回 true。
     * @method  _mouseCapture
     * @returns {boolean}
     * @private
     */
	_mouseCapture: function(/* event */) { return true; }
});

}));
