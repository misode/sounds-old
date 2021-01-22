import Octicon from "./Octicon"

export default (type: string) => {
  const el = document.createElement(type)
  return {
    class(c: string) {
      el.classList.add(c)
      return this
    },
    text(v: string) {
      return this.set('textContent', v)
    },
    value(v: string | number) {
      return this.set('value', v)
    },
    set(k: string, v: string | number) {
      (el as any)[k] = typeof v === 'string' ? v : `${v}`
      return this
    },
    attr(k: string, v: string) {
      el.setAttribute(k, v)
      return this
    },
    onClick(fn: (evt: MouseEvent) => void) {
      el.addEventListener('click', fn)
      return this
    },
    onChange(fn: (value: any) => void) {
      el.addEventListener('change', () => fn((el as any).value))
      return this
    },
    icon(i: keyof typeof Octicon) {
      el.insertAdjacentHTML('afterbegin', Octicon[i])
      return this
    },
    get() {
      return el
    }
  }
}
