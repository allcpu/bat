// Relies on utils/elem

class Workspace {
  constructor (blocks, wrapper) {
    this._onPointerDown = this._onPointerDown.bind(this)
    this._onPointerMove = this._onPointerMove.bind(this)
    this._onPointerUp = this._onPointerUp.bind(this)
    this._onStartScroll = this._onStartScroll.bind(this)
    this._onInput = this._onInput.bind(this)

    this.wrapper = wrapper
    this.scriptsElem = Elem('g', {class: 'block-scripts'}, [], true)
    this.svg = Elem('svg', {class: 'block-workspace'}, [
      this.scriptsElem
    ], true)
    wrapper.appendChild(this.svg)
    this._input = Elem('input', {
      className: 'block-input block-hidden',
      oninput: this._onInput,
      onblur: () => {
        if (this._showingInput) {
          // this.hideInput()
        }
      }
    })
    wrapper.appendChild(this._input)

    this.blocks = blocks
    this.scripts = []
    this._transform = {left: 0, top: 0, scale: 1}

    this._pointers = {}
    this.svg.addEventListener('pointerdown', this._onPointerDown)
    this.svg.addEventListener('pointermove', this._onPointerMove)
    this.svg.addEventListener('pointerup', this._onPointerUp)

    blocks.onDrag(this.svg, this._onStartScroll)
  }

  _onInput () {
    if (this._inputListener) {
      this._inputListener(this._input.value)
    }
  }

  hideInput () {
    if (this._inputEndListener) {
      this._inputEndListener(this._input)
      this._inputEndListener = null
    }
    this._inputListener = null
    this._showingInput = false
    this._input.classList.add('block-hidden')
  }

  showInput (onInput, onEnd) {
    if (this._showingInput) {
      this.hideInput()
    }
    this._inputListener = onInput
    this._inputEndListener = onEnd
    this._showingInput = true
    this._input.classList.remove('block-hidden')
    this._input.focus()
    return this._input
  }

  add (script) {
    script.workspace = this
    this.scripts.push(script)
    this.scriptsElem.appendChild(script.elem)
  }

  _updateTransformation () {
    const {left, top, scale} = this._transform
    this.scriptsElem.setAttributeNS(null, 'transform', `scale(${scale}) translate(${-left}, ${-top})`)
    this._input.style.transform = `scale(${scale}) translate(${-left}px, ${-top}px)`
  }

  scrollTo (left, top) {
    this._transform.left = left
    this._transform.top = top
    this._updateTransformation()
  }

  zoomTo (scale) {
    this._transform.scale = scale
    this._updateTransformation()
  }

  getTransform () {
    const {left, top, scale} = this._transform
    return {left, top, scale}
  }

  _onStartScroll (initX, initY) {
    const {left: initLeft, top: initTop, scale: initScale} = this._transform
    return {
      move: (x, y) => {
        // Should also notify the dragged blocks to recalculate their snappables
        this.scrollTo(
          initLeft + initX / initScale - x / this._transform.scale,
          initTop + initY / initScale - y / this._transform.scale
        )
      }
    }
  }

  _onPointerDown (e) {
    this._pointers[e.pointerId] = {
      elem: e.target,
      startX: e.clientX,
      startY: e.clientY,
      dragging: false
    }
  }

  _onPointerMove (e) {
    const pointerEntry = this._pointers[e.pointerId]
    if (!pointerEntry) {
      return
    } else if (pointerEntry.dragging) {
      if (pointerEntry.dragMove) {
        pointerEntry.dragMove(e.clientX, e.clientY)
      }
    } else if (this.constructor._pythagoreanMagic(
      e.clientX - pointerEntry.startX,
      e.clientY - pointerEntry.startY,
      this.constructor.minDragDistance
    ) < 0) {
      pointerEntry.dragging = true
      const dragElem = pointerEntry.elem.closest('[data-block-drag]')
      if (dragElem) {
        const listener = this.blocks.dragListeners[dragElem.dataset.blockDrag]
        const {move, end} = listener(pointerEntry.startX, pointerEntry.startY)
        pointerEntry.dragMove = move
        pointerEntry.dragEnd = end
        this.svg.setPointerCapture(e.pointerId)
      }
    }
  }

  _onPointerUp (e) {
    const pointerEntry = this._pointers[e.pointerId]
    if (!pointerEntry) {
      return
    } else if (pointerEntry.dragging) {
      if (pointerEntry.dragEnd) {
        pointerEntry.dragEnd()
      }
    } else {
      const clickElem = pointerEntry.elem.closest('[data-block-click]')
      if (clickElem) {
        this.blocks.clickListeners[clickElem.dataset.blockClick]()
      }
    }
    delete this._pointers[e.pointerId]
  }

  /**
   * Compares the legs and hypotenuse
   */
  static _pythagoreanMagic(a, b, c) {
    return c * c - (a * a + b * b)
  }
}

Workspace.minDragDistance = 3

class PaletteWorkspace {
  constructor () {
    // TODO
  }
}
