/*!
 * jQuery UI Core @VERSION
 * http://jqueryui.com
 *
 * Copyright 2014 jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/category/ui-core/
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
/**
 * UI 核心（UI Core）<br/>
 *
 * @class ui
 * @extends $
 * @module ui
 * @constructor
 * @namespace $
 */
// $.ui might exist from components with no dependencies, e.g., $.ui.position
$.ui = $.ui || {};

$.extend( $.ui, {
	version: "@VERSION",

	keyCode: {
		BACKSPACE: 8,
		COMMA: 188,
		DELETE: 46,
		DOWN: 40,
		END: 35,
		ENTER: 13,
		ESCAPE: 27,
		HOME: 36,
		LEFT: 37,
		PAGE_DOWN: 34,
		PAGE_UP: 33,
		PERIOD: 190,
		RIGHT: 39,
		SPACE: 32,
		TAB: 9,
		UP: 38
	}
});

// plugins
/**
 * @class extend
 */
$.fn.extend({
    /**
     * 获取最近的可滚动的祖先。
     * 换句话说，.scrollParent() 查找当前所选元素在其内滚动的元素。
     * 该方法只在包含一个元素的 jQuery 对象上工作。
     * 
     * @method scrollParent
     * @return {*|jQuery|HTMLElement}    jQuery
     */
	scrollParent: function( includeHidden) {
		var position = this.css( "position" ),
			excludeStaticParent = position === "absolute",
			overflowRegex = includeHidden ? /(auto|scroll|hidden)/ : /(auto|scroll)/,
			scrollParent = this.parents().filter( function() {
				var parent = $( this );
				if ( excludeStaticParent && parent.css( "position" ) === "static" ) {
					return false;
				}
				return overflowRegex.test( parent.css( "overflow" ) + parent.css( "overflow-y" ) + parent.css( "overflow-x" ) );
			}).eq( 0 );

		return position === "fixed" || !scrollParent.length ? $( this[ 0 ].ownerDocument || document ) : scrollParent;
	},
	/**
	 * 为匹配的元素集合生成并申请一个唯一的 Id。<br/>
	 * 许多小部件需要元素生成唯一的 id。<br/>
	 * .uniqueId() 会检查元素是否有 id，如果元素没有 id，它将生成一个 id，并设置为该元素的 id。
	 * 在未检查元素是否具有 id 就调用 .uniqueId() 是安全的。<br/>
	 * 当小部件使用后需要清除，如果 id 是通过 .uniqueId() 添加的，.removeUniqueId() 方法将从元素上移除 id，
	 * 如果 id 不是通过 .uniqueId() 添加的，则无影响。
	 * .removeUniqueId() 之所以能区分 id，是因为 .uniqueId() 生成的 id 带有前缀 "ui-id-"。
	 * @method uniqueId
	 * @return {jQuery} [description]
	 * @since 1.9
	 */
	uniqueId: (function() {
		var uuid = 0;

		return function() {
			return this.each(function() {
				if ( !this.id ) {
					this.id = "ui-id-" + ( ++uuid );
				}
			});
		};
	})(),
	/**
	 * 为匹配的元素集合移除由 .uniqueId() 设置的 Id。<br/>
	 * .removeUniqueId() 移除由 .uniqueId() 设置的 id。
	 * 在未使用 .uniqueId() 设置 id 的元素上调用 .removeUniqueId() 则无影响，即使该元素有一个 id。
	 * @method removeUniqueId
	 * @return {jQuery}       [description]
	 * @since 1.9
	 */
	removeUniqueId: function() {
		return this.each(function() {
			if ( /^ui-id-\d+$/.test( this.id ) ) {
				$( this ).removeAttr( "id" );
			}
		});
	}
});

// selectors
/**
 * 选择可被聚焦的元素。
 * @method focusable
 * @param  {[type]}  element          [description]
 * @param  {Boolean} isTabIndexNotNaN [description]
 * @return {[type]}                   [description]
 */
function focusable( element, isTabIndexNotNaN ) {
	var map, mapName, img,
		nodeName = element.nodeName.toLowerCase();
	if ( "area" === nodeName ) {
		map = element.parentNode;
		mapName = map.name;
		if ( !element.href || !mapName || map.nodeName.toLowerCase() !== "map" ) {
			return false;
		}
		img = $( "img[usemap='#" + mapName + "']" )[ 0 ];
		return !!img && visible( img );
	}
	return ( /input|select|textarea|button|object/.test( nodeName ) ?
		!element.disabled :
		"a" === nodeName ?
			element.href || isTabIndexNotNaN :
			isTabIndexNotNaN) &&
		// the element and all of its ancestors must be visible
		visible( element );
}

function visible( element ) {
	return $.expr.filters.visible( element ) &&
		!$( element ).parents().addBack().filter(function() {
			return $.css( this, "visibility" ) === "hidden";
		}).length;
}

$.extend( $.expr[ ":" ], {
	data: $.expr.createPseudo ?
		$.expr.createPseudo(function( dataName ) {
			return function( elem ) {
				return !!$.data( elem, dataName );
			};
		}) :
		// support: jQuery <1.8
		function( elem, i, match ) {
			return !!$.data( elem, match[ 3 ] );
		},
	/**
	 * 选择可被聚焦的元素。<br/>
	 * jQuery( ":focusable" )<br/>
	 * 一些元素本身是可聚焦的（focusable），而另一些元素需要显式设置 tab 索引。以上两种情况，为了可聚焦（focusable），元素都必须是可见的。<br/>
	 * 下面类型的元素如果未被禁用，则是可聚焦的（focusable）：input、select、textarea、button 和 object。<br/>
	 * 锚如果带有 href 或 tabindex 属性，则是可聚焦的（focusable）。<br/>
	 * area 元素如果在一个已命名的 map 内，且带有 href 属性，且有一个可见的图像使用了该 map，则是可聚焦的（focusable）。<br/>
	 * 所有其他完全基于 tabindex 属性和可见度的元素是可聚焦的（focusable）。<br/>
	 * 
	 * 注释：带有负的 tab 索引的元素是 :focusable，不是 :tabbable。<br/>
	 * 
	 * @method focusable
	 * @extends $
	 * @param  {[type]}  element [description]
	 * @return {[type]}          [description]
	 * @example
	 *	//选择可聚焦的元素，且用一个红色边框突出显示。
	 *	<!--html-->
	 *	<div><input value="文本输入"></div>
	 *	<div><a>不带有 href 的锚</a></div>
	 *	<div><a href="#">带有 href 的锚</a></div>
	 *	<div><p>不带有 tabindex 的段落</p></div>
	 *	<div><p tabindex="1">带有 tabindex 的段落</p></div>
	 *	<!--js-->
	 *	<script>
	 *		$( ":focusable" ).css( "border-color", "red" );
	 *	</script>
	 */
	focusable: function( element ) {
		return focusable( element, !isNaN( $.attr( element, "tabindex" ) ) );
	},

	tabbable: function( element ) {
		var tabIndex = $.attr( element, "tabindex" ),
			isTabIndexNaN = isNaN( tabIndex );
		return ( isTabIndexNaN || tabIndex >= 0 ) && focusable( element, !isTabIndexNaN );
	}
});

// support: jQuery <1.8
if ( !$( "<a>" ).outerWidth( 1 ).jquery ) {
	$.each( [ "Width", "Height" ], function( i, name ) {
		var side = name === "Width" ? [ "Left", "Right" ] : [ "Top", "Bottom" ],
			type = name.toLowerCase(),
			orig = {
				innerWidth: $.fn.innerWidth,
				innerHeight: $.fn.innerHeight,
				outerWidth: $.fn.outerWidth,
				outerHeight: $.fn.outerHeight
			};

		function reduce( elem, size, border, margin ) {
			$.each( side, function() {
				size -= parseFloat( $.css( elem, "padding" + this ) ) || 0;
				if ( border ) {
					size -= parseFloat( $.css( elem, "border" + this + "Width" ) ) || 0;
				}
				if ( margin ) {
					size -= parseFloat( $.css( elem, "margin" + this ) ) || 0;
				}
			});
			return size;
		}

		$.fn[ "inner" + name ] = function( size ) {
			if ( size === undefined ) {
				return orig[ "inner" + name ].call( this );
			}

			return this.each(function() {
				$( this ).css( type, reduce( this, size ) + "px" );
			});
		};

		$.fn[ "outer" + name] = function( size, margin ) {
			if ( typeof size !== "number" ) {
				return orig[ "outer" + name ].call( this, size );
			}

			return this.each(function() {
				$( this).css( type, reduce( this, size, true, margin ) + "px" );
			});
		};
	});
}

// support: jQuery <1.8
if ( !$.fn.addBack ) {
	$.fn.addBack = function( selector ) {
		return this.add( selector == null ?
			this.prevObject : this.prevObject.filter( selector )
		);
	};
}

// support: jQuery 1.6.1, 1.6.2 (http://bugs.jquery.com/ticket/9413)
if ( $( "<a>" ).data( "a-b", "a" ).removeData( "a-b" ).data( "a-b" ) ) {
	$.fn.removeData = (function( removeData ) {
		return function( key ) {
			if ( arguments.length ) {
				return removeData.call( this, $.camelCase( key ) );
			} else {
				return removeData.call( this );
			}
		};
	})( $.fn.removeData );
}

// deprecated
$.ui.ie = !!/msie [\w.]+/.exec( navigator.userAgent.toLowerCase() );
/**
 * @class extend
 */
$.fn.extend({
	focus: (function( orig ) {
		return function( delay, fn ) {
			return typeof delay === "number" ?
				this.each(function() {
					var elem = this;
					setTimeout(function() {
						$( elem ).focus();
						if ( fn ) {
							fn.call( elem );
						}
					}, delay );
				}) :
				orig.apply( this, arguments );
		};
	})( $.fn.focus ),

	disableSelection: (function() {
		var eventType = "onselectstart" in document.createElement( "div" ) ?
			"selectstart" :
			"mousedown";

		return function() {
			return this.bind( eventType + ".ui-disableSelection", function( event ) {
				event.preventDefault();
			});
		};
	})(),

	enableSelection: function() {
		return this.unbind( ".ui-disableSelection" );
	},

	zIndex: function( zIndex ) {
		if ( zIndex !== undefined ) {
			return this.css( "zIndex", zIndex );
		}

		if ( this.length ) {
			var elem = $( this[ 0 ] ), position, value;
			while ( elem.length && elem[ 0 ] !== document ) {
				// Ignore z-index if position is set to a value where z-index is ignored by the browser
				// This makes behavior of this function consistent across browsers
				// WebKit always returns auto if the element is positioned
				position = elem.css( "position" );
				if ( position === "absolute" || position === "relative" || position === "fixed" ) {
					// IE returns 0 when zIndex is not specified
					// other browsers return a string
					// we ignore the case of nested elements with an explicit value of 0
					// <div style="z-index: -10;"><div style="z-index: 0;"></div></div>
					value = parseInt( elem.css( "zIndex" ), 10 );
					if ( !isNaN( value ) && value !== 0 ) {
						return value;
					}
				}
				elem = elem.parent();
			}
		}

		return 0;
	}
});


// $.ui.plugin is deprecated. Use $.widget() extensions instead.
/**
 * UI 核心（UI Core）plugin
 * @class plugin
 * @extends $.ui
 * @namespace $.ui
 * @type {Object}
 */
$.ui.plugin = {
    /**
     * [add description]
     * @method add
     * @param  {[type]} module [description]
     * @param  {[type]} option [description]
     * @param  {[type]} set    [description]
     */
	add: function( module, option, set ) {
		var i,
			proto = $.ui[ module ].prototype;
		for ( i in set ) {
			proto.plugins[ i ] = proto.plugins[ i ] || [];
			proto.plugins[ i ].push( [ option, set[ i ] ] );
		}
	},
	/**
	 * [call description]
	 * @method call
	 * @param  {[type]} instance          [description]
	 * @param  {[type]} name              [description]
	 * @param  {[type]} args              [description]
	 * @param  {[type]} allowDisconnected [description]
	 * @return {[type]}                   [description]
	 */
	call: function( instance, name, args, allowDisconnected ) {
		var i,
			set = instance.plugins[ name ];

		if ( !set ) {
			return;
		}

		if ( !allowDisconnected && ( !instance.element[ 0 ].parentNode || instance.element[ 0 ].parentNode.nodeType === 11 ) ) {
			return;
		}

		for ( i = 0; i < set.length; i++ ) {
			if ( instance.options[ set[ i ][ 0 ] ] ) {
				set[ i ][ 1 ].apply( instance.element, args );
			}
		}
	}
};

}));
