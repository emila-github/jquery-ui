YUI.add("yuidoc-meta", function(Y) {
   Y.YUIDoc = { meta: {
    "classes": [
        "$.extend",
        "$.ui",
        "$.ui.plugin",
        "ui.draggable",
        "ui.mouse",
        "ui.widget"
    ],
    "modules": [
        "bridge",
        "draggable",
        "mouse",
        "ui",
        "widget"
    ],
    "allModules": [
        {
            "displayName": "bridge",
            "name": "bridge",
            "description": "jQuery.widget.bridge() 方法是 jQuery 部件库（Widget Factory） 的一部分。它扮演着由 $.widget() 创建的对象和 jQuery API 之间的中介。<br/>\n$.widget.bridge() 做如下事情：<br/>\n连接一个常规的 JavaScript 构造函数到 jQuery API。<br/>\n自动创建对象实例，并存储在元素的 $.data 缓存内。<br/>\n允许调用公有方法。<br/>\n防止调用私有方法。<br/>\n防止在未初始化的对象上调用方法。<br/>\n防止多个初始化。<br/>"
        },
        {
            "displayName": "draggable",
            "name": "draggable",
            "description": "可拖拽小部件（Draggable Widget）<br/>\n允许使用鼠标移动元素。<br/>\n\n注释：让被选元素可被鼠标拖拽。如果您不只是拖拽，而是拖拽 & 放置，请查看 jQuery UI 可放置（Droppable）插件，为可拖拽元素提供了一个放置目标。<br/>"
        },
        {
            "displayName": "mouse",
            "name": "mouse",
            "description": "$.ui.mouse 鼠标交互<br/>\n与 jQuery.Widget 相似，鼠标交互的目的不是直接使用。\n这是一个纯粹给其他小部件继承用的基础层。该页面有添加到 jQuery.Widget 的文档，但是它包含了不能被覆盖的内部方法。\n公共的 API 是 _mouseStart()、_mouseDrag()、_mouseStop() 和 _mouseCapture()。"
        },
        {
            "displayName": "ui",
            "name": "ui",
            "description": "UI 核心（UI Core）<br/>"
        },
        {
            "displayName": "widget",
            "name": "widget",
            "description": "$.ui.widget 部件库（Widget Factory）<br/>\n使用与所有 jQuery UI 小部件相同的抽象化来创建有状态的 jQuery 插件。<br/>\n您可以使用 $.Widget 对象作为要继承的基础，或者可以明确地从现有的 jQuery UI 或第三方控件，从头开始创建新的小部件。\n定义一个带有相同名称的小部件来继承基础部件，甚至允许您适当地扩展小部件。<br/>\n\njQuery UI 中包含许多保持状态的小部件，因此比典型的 jQuery 插件稍有不同的使用模式。\n所有的jQuery UI 小部件使用相同的模式，这是由部件库（Widget Factory）定义的。\n所以，只要您学会使用其中一个，您就知道如何使用其他的小部件（Widget）。<br/>"
        }
    ]
} };
});