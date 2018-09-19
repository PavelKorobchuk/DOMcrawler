const fs = require('fs');
const {JSDOM} = require('jsdom');
const _ = require('lodash');

const argsArr = process.argv;
const originPath = './origin/';
const samplePath = './samples/';
const processArgs = {
    origin: `${originPath}${argsArr[2]}` || '',
    sample: `${samplePath}${argsArr[3]}` || ''
};


class GetCurrentBtn {

    constructor(id) {
        this.originFile = fs.readFileSync(processArgs.origin);
        this.sampleFile = fs.readFileSync(processArgs.sample);
        this.originDom = new JSDOM(this.originFile);
        this.sampleDom = new JSDOM(this.sampleFile);
        this.originNodeId = id;
    }

    /**
     * Get all attributes for the origin button
     *
     * @return {*}
     */
    getOriginBtnData() {
        let buttonProps = {},
            originBtn = this.originDom.window.document.getElementById(this.originNodeId),
            array = Array.prototype.slice.apply(originBtn.attributes);

        array.forEach(attr => buttonProps[attr.name] = attr.value);

        return buttonProps
    }

    /**
     * Method to find needed button from the comparing page
     * @param elements
     * @param buttonProps
     * @param dom
     * @returns {*}
     */
    findSingleElement(elements, buttonProps) {
        const pathArr = [];
        let currentElementIndex = 0,
            currentElementProps = 0,
            globalNode;

        if (!elements) {
            for (let prop in buttonProps) {
                elements = this.sampleDom.window.document.querySelectorAll(`[${prop}="${buttonProps[prop]}"]`);
                if (elements.length > 0) return this.findSingleElement(elements, _.omit(buttonProps, `${prop}`));
            }
        }

        elements.forEach((element, index) => {
            let count = 0;

            for (let prop in buttonProps) {
                element.attributes[prop] && element.attributes[prop].value === buttonProps[prop] && count++
            }
            currentElementIndex = currentElementProps < count ? index : currentElementIndex;
        });

        globalNode = elements[currentElementIndex];
        pathArr.push(this.getFullNodeName(globalNode));

        while (globalNode.nodeName.toLowerCase() !== 'body') {
            globalNode = globalNode.parentNode;
            pathArr.push(this.getFullNodeName(globalNode))
        }

        return pathArr.reverse().join('>');
    }

    /**
     * Creating full node name for the current DOM element
     * @param node
     * @returns {string}
     */
    getFullNodeName(node) {
        let name = node.nodeName.toLowerCase(),
            index = [...node.parentNode.children].indexOf(node),
            attrs = {
                '#': node.id || '',
                '.': node.className ? node.className.split(' ').join('.') : ''
            };

        for (let prop in attrs) {
            if (attrs[prop]) {
                return `${name}${prop}${attrs[prop]}`;
            }
        }

        return index >= 0 && name !== 'body' ? `${name}[${index}]` : name
    }

    /**
     * Gegging args and found button logging
     * @param processArgs
     */
    findElementPath() {
        let elements,
            buttonProps = this.getOriginBtnData();


        return this.findSingleElement(elements, buttonProps);
    }
}

/**
 * Running crawler
 *
 * @param id
 * @type {GetCurrentBtn}
 */
const runCrawler = new GetCurrentBtn('make-everything-ok-button');
console.log(runCrawler.findElementPath());