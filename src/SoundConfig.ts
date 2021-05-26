import { Howl } from 'howler'
import { assetObjects, soundEvents, getResourceUrl, removeSoundConfig } from '.'
import $ from './Element'
import Octicon from './Octicon'

type SoundStatus = 'loading' | 'loaded' | 'playing'

export class SoundConfig {
  private howls: Howl[] = []
  private status: SoundStatus = 'loading'

  constructor(public el: Element, sound: string, pitch = 1, volume = 1) {
    el.append($('button').class('play').text('Play').icon('play')
      .onClick(() => {
        if (this.status === 'loaded') {
          this.updateStatus('playing')
        } else if (this.status === 'playing') {
          this.updateStatus('loaded')
        }
      }).get())

    el.append($('input').class('sound').attr('type', 'text')
      .onChange(v => {
        this.createHowls(v)
      }).attr('list', 'sound-list').attr('spellcheck', 'false').value(sound).get())

    el.append($('label').class('offset-label').text('Offset: ').get())
    el.append($('input').class('offset').attr('type', 'number')
      .attr('min', '0').value(0).get())

    el.append($('label').class('pitch-label').text(`Pitch: ${pitch}`).get())
    el.append($('input').class('pitch').attr('type', 'range')
      .onChange(v => {
        this.howls.forEach(h => h.rate(v))
        this.el.querySelector('.pitch-label')!.textContent = `Pitch: ${v}`
      }).attr('min', '0.5').attr('max', '2').attr('step', '0.01').value(pitch).get())

    el.append($('label').class('volume-label').text(`Volume: ${volume}`).get())
    el.append($('input').class('volume').attr('type', 'range')
      .onChange(v => {
        this.howls.forEach(h => h.volume(v))
        this.el.querySelector('.volume-label')!.textContent = `Volume: ${v}`
      }).attr('min', '0').attr('max', '1').attr('step', '0.01').value(volume).get())

    el.append($('button').class('copy').text('Copy').icon('terminal')
      .onClick(el => {
        const command = `/playsound minecraft:${this.get('sound')} master @s ~ ~ ~ ${this.get('pitch')} ${this.get('volume')}`
        el.setAttribute('data-command', command)
        const commandEl = document.createElement('input')
        el.append(commandEl)
        commandEl.value = command
        commandEl.select()
        document.execCommand('copy')
        commandEl.remove()
        el.querySelector('svg')!.outerHTML = Octicon.check
        document.body.addEventListener('click', () => {
          el.removeAttribute('data-command')
          el.querySelector('svg')!.outerHTML = Octicon.terminal
        }, { capture: true, once: true })
      }).get())
    el.append($('button').class('remove').icon('trash')
      .onClick(() => {
        this.stop()
        removeSoundConfig(this)
      }).get())

    this.createHowls(sound)
  }

  private updateStatus(status: SoundStatus) {
    this.status = status
    this.el.classList.toggle('invalid', this.howls.length === 0)
    this.el.classList.toggle('playing', this.status === 'playing')
    this.el.classList.toggle('loading', this.status === 'loading')
    if (this.status === 'playing') {
      const howl = Math.floor(Math.random() * this.howls.length)
      this.howls[howl].play()
    } else {
      this.howls.forEach(h => h.stop())
    }
  }

  private get(c: string) {
    const input = this.el.querySelector(`input.${c}`)
    if (!(input instanceof HTMLInputElement)) return null
    switch(input.type) {
      case 'range':
      case 'number': return parseFloat(input.value)
      case 'checkbox': return input.checked
      default: return input.value
    }
  }

  private createHowls(sound: string) {
    const soundEvent = soundEvents[sound] || { sounds: [] }

    this.howls = []
    for (const soundEntry of soundEvent.sounds) {
      const soundPath = typeof soundEntry === 'string' ? soundEntry : soundEntry.name
      const hash = assetObjects[`minecraft/sounds/${soundPath}.ogg`].hash
      const url = getResourceUrl(hash)

      const howl = new Howl({
        src: [url],
        format: ['ogg'],
        volume: this.get('volume') as number,
        rate: this.get('pitch') as number,
      })
      howl.on('end', () => {
        if (this.status === 'playing') {
          this.updateStatus('loaded')
        }
      })
      const loaded = () => {
        if (this.status === 'loading' &&
            this.howls.every(h => h.state() === 'loaded')) {
          this.updateStatus('loaded')
        }
      }
      if (howl.state() === 'loaded') {
        setTimeout(() => loaded())
      } else {
        howl.on('load', () => {
          loaded()
        })
      }
      this.howls.push(howl)
    }
    this.updateStatus('loading')
  }

  public getOffset() {
    return this.get('offset') as number
  }

  public play() {
    if (this.status === 'loaded') {
      this.updateStatus('playing')
    }
  }

  public stop() {
    if (this.status === 'playing') {
      this.updateStatus('loaded')
    }
  }
}
