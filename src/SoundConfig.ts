import { Howl } from 'howler'
import { assetObjects, soundEvents, getResourceUrl } from '.'
import $ from './Element'

export class SoundConfig {
  private howl: Howl | null

  constructor(private el: Element, sound: string) {
    el.append($('button').class('play').text('Play').icon('play')
      .onClick(() => {
        if (this.howl?.playing()) {
          this.howl.stop()
        } else {
          this.howl?.play()
        }
      }).get())

    el.append($('input').class('sound').attr('type', 'text')
      .onChange(v => {
        this.howl = this.createHowl(v)
        this.el.classList.toggle('invalid', this.howl === null)
      }).attr('list', 'sound-list').attr('spellcheck', 'false').value(sound).get())

    el.append($('label').class('pitch-label').text('Pitch: 1').get())
    el.append($('input').class('pitch').attr('type', 'range')
      .onChange(v => {
        this.howl?.rate(v)
        this.el.querySelector('.pitch-label')!.textContent = `Pitch: ${v}`
      }).attr('min', '0.5').attr('max', '2').attr('step', '0.01').value(1).get())

    el.append($('label').class('volume-label').text('Volume: 1').get())
    el.append($('input').class('volume').attr('type', 'range')
      .onChange(v => {
        this.howl?.volume(v)
        this.el.querySelector('.volume-label')!.textContent = `Volume: ${v}`
      }).attr('min', '0').attr('max', '1').attr('step', '0.01').value(1).get())

    this.howl = this.createHowl(sound)
    this.el.classList.toggle('invalid', this.howl === null)
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

  private createHowl(sound: string) {
    const soundEvent = soundEvents[sound]
    if (!soundEvent) return null

    const soundEntry = soundEvent.sounds[0]
    const soundPath = typeof soundEntry === 'string' ? soundEntry : soundEntry.name
    const hash = assetObjects[`minecraft/sounds/${soundPath}.ogg`].hash
    const url = getResourceUrl(hash)

    const howl = new Howl({
      src: [url],
      format: ['ogg'],
      volume: this.get('volume') as number,
      rate: this.get('pitch') as number
    })

    howl.on('play', () => {
      this.el.classList.add('playing')
    })
    howl.on('end', () => {
      this.el.classList.remove('playing')
    })
    howl.on('stop', () => {
      this.el.classList.remove('playing')
    })

    return howl
  }
}
