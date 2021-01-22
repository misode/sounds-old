import { Howl } from 'howler'
import { assetObjects, soundEvents, getResourceUrl } from '.'
import $ from './Element'

export class SoundConfig {
  private howl: Howl | null = null
  public pitch: number = 1
  public volume: number = 1
  constructor(public el: Element, sound: string = '') {
    el.append($('button').text('Play').icon('play').onClick(() => this.onPlay()).get())

    el.append($('input').class('sound').attr('list', 'sound-list').set('value', sound).get())

    el.append($('label').class('pitch-label').text('Pitch: 1').get())
    el.append($('input').class('pitch').attr('type', 'range')
      .onChange(v => this.el.querySelector('.pitch-label')!.textContent = `Pitch: ${v}`)
      .attr('min', '0.5').attr('max', '2').attr('step', '0.01').set('value', 1).get())

    el.append($('label').class('volume-label').text('Volume: 1').get())
    el.append($('input').class('volume').attr('type', 'range')
      .onChange(v => this.el.querySelector('.volume-label')!.textContent = `Volume: ${v}`)
      .attr('min', '0').attr('max', '1').attr('step', '0.1').set('value', 1).get())
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

  private onPlay() {
    const soundEvent = soundEvents[this.get('sound') as string]
    if (!soundEvent) return
    const sound = soundEvent.sounds[0]
    const soundPath = typeof sound === 'string' ? sound : sound.name
    const hash = assetObjects[`minecraft/sounds/${soundPath}.ogg`].hash
    const url = getResourceUrl(hash)

    if (this.howl) {
      this.howl.unload()
    }
    this.howl = new Howl({
      src: [url],
      format: ['ogg'],
      autoplay: true, 
      volume: this.get('volume') as number,
      rate: this.get('pitch') as number
    })
  }
}
