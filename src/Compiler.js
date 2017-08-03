/*
    Compiler将DOM元素解析，找出指令与占位符，建立Watcher，注册到Observer的监听队列中，在接收到通知后，
    根据不同的指令，进行更新DOM等不同处理
*/
function Compiler(el, vm) {
    this.el = CompileUtil.isNodeElement(el) ? el : document.querySelector(el);
    this.vm = vm;
    if (this.el) {
        this.fragment = this.nodeToFragment(this.el);
        this.compile(this.fragment);
        // 将文档碎片放回真实dom
        this.el.appendChild(this.fragment);
    }
}

Compiler.prototype = {
    // 文档碎片，遍历过程中会有多次的dom操作，为提高性能我们会将el节点转化为fragment文档碎片进行解析操作
    // 解析操作完成，将其添加回真实dom节点中
    nodeToFragment: function(el) {
        let fragment = document.createDocumentFragment();
        let child;

        while (child = el.firstChild) {
            fragment.appendChild(child);
        }
        return fragment;
    },
    compile: function(el) {
        let self = this,
            childNodes = el.childNodes;
        if (CompileUtil.isNodeElement(el)) {
            this.compileNodeElement(el);
        } else if (CompileUtil.isTextElement(el)) {
            this.compileTextElement(el);
        }
        if (childNodes && childNodes.length) {
            //使用slice进行浅复制，生成一个新的数组。否则处理中childNodes这个数组会变化，引起循环异常
            //我碰到的情况是，数组的变化会使循环重新从头开始
            //注意slice浅复制与clone的深复制的区分
            [].slice.call(childNodes).forEach(function(node) {
                self.compile(node);
            });
        }

    },
    compileNodeElement: function(el) {
        let self = this,
            attrs = el.attributes;
        [].forEach.call(attrs, function(attr) {
            let name = attr.name,
                exp = attr.value;
            if (CompileUtil.isDirective(name)) {
                let sndDir = name.substr(2);
                if (CompileUtil.isEventDirective(sndDir)) {
                    //v-on:click
                    let eventDir = sndDir.substr(3);
                    CompileUtil.handleEvent(el, self.vm, eventDir, exp);
                } else {
                    self[sndDir] && self[sndDir](el, exp);
                }
            }
        });
    },
    compileTextElement: function(el) {
        let reg = /\{\{(.*?)\}\}/g,
            match;
        //因为TextElement中，可能不只有占位符，而是普通文本与占位符的混合，如下
        //1{{a}}2{{b}}3
        let lastIndex = 0,
            normalText;
        let content = el.textContent;
        if (!content.match(reg)) return; //没有绑定数据，不处理
        let fragment = document.createDocumentFragment();
        let element;
        while (match = reg.exec(content)) {
            if (match.index > lastIndex) {
                //普通文本
                normalText = content.slice(lastIndex, match.index);
                element = document.createTextNode(normalText);
                fragment.appendChild(element);
            }
            lastIndex = reg.lastIndex;
            //占位符
            let exp = match[1];
            element = document.createTextNode(' ');
            fragment.appendChild(element);
            //绑定占位符与表达式
            this.bind(element, exp, 'text');
        }
        if (lastIndex < content.length) {
            //剩余的普通文本
            normalText = content.slice(lastIndex);
            element = document.createTextNode(normalText);
            fragment.appendChild(element);
        }
        this.replaceElement(el, fragment);
    },
    replaceElement: function(el, fragment) {
        let parent = el.parentNode;
        if (parent) {
            parent.replaceChild(fragment, el);
        }
    },
    bind: function(node, exp, update) {
        //绑定view与model
        //添加一个Watcher，监听exp相关的所有字段变化，具体方法可以看Watcher的注释
        let updateFn = update + "Updater";
        updateFn && new Watcher(exp, this.vm, function(newVal, oldVal) {
            CompileUtil[updateFn] && CompileUtil[updateFn](node, newVal, oldVal);
        });
    },
    model: function(node, exp) {
        let self = this;
        //v-model,exp只能是绑定到一个变量上，不能是表达式
        if (node.tagName.toLocaleLowerCase() === 'input') {
            self.bind(node, exp, 'value');
            node.addEventListener('input', function(e) {
                self.vm[exp] = e.target.value;
            });
        }
    }
};
const CompileUtil = {
    isDirective: function(name) {
        //是否是指令
        return name.indexOf('v-') === 0;
    },
    isEventDirective: function(name) {
        //是否是事件指令
        return name.indexOf('on') === 0;
    },
    isTextElement: function(node) {
        //是否是纯文字节点
        return node.nodeType === 3;
    },
    isNodeElement: function(node) {
        //是否是普通节点
        return node.nodeType === 1;
    },
    textUpdater: function(node, newVal, oldVal) {
        node.textContent = newVal;
    },
    handleEvent: function(node, vm, event, exp) {
        let fn = vm._options.methods && vm._options.methods[exp];
        node.addEventListener(event, fn.bind(vm), false);
    },
    valueUpdater: function(node, newVal, oldVal) {
        node.value = newVal ? newVal : '';
    }
};