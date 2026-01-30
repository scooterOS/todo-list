class Renderer {
    
    addElement(parentElement, type, textContent='', classList=[], attr={}) {
        var element = document.createElement(type);

        element.textContent = textContent;
        element.classList.add(...classList);
        Object.entries((attr ?? [])).forEach(([key, value]) => element.setAttribute(key, value));  

        parentElement.appendChild(element);

        return element;
    }

    recursiveAdd(parentElement, objectList) {
        var element;

        for (let i = 0; i < objectList.length; i++) {
            element = document.createElement(objectList[i].type);
    
            element.textContent = objectList[i].text ?? '';
            element.classList.add(...(objectList[i].classList ?? []));
            Object.entries((objectList[i].attr ?? [])).forEach(([key, value]) => element.setAttribute(key, value));  

            parentElement.appendChild(element);

            if (objectList[i].innerElem !== undefined) this.recursiveAdd(element, objectList[i].innerElem);
        }
    }

    updateText(element, textContent) {
        element.textContent = textContent;
    }

    updateClassList(element, addClassList, removeClassList) {
        element.classList.add(...addClassList);
        element.classList.remove(...removeClassList);
    }

    updateAttributes(element, attrObject) {
        Object.entries(attrObject).forEach(([key, value]) => element.setAttribute(key, value));
    }

    removeElement(element) {
        element.remove();
    }

    clearContents(element) {
        element.innerHTML = '';
    }
}

export default new Renderer();