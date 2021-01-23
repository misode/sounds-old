import { Howler } from 'howler';
import $ from './Element'
import { SoundConfig } from './SoundConfig';
import "./styles.css";

const mainControlsEl = document.getElementById('main-controls') as HTMLDivElement
const soundConfigsEl = document.getElementById('sound-configs') as HTMLDivElement
const soundsListEl = document.getElementById('sound-list') as HTMLDataListElement

export let assetObjects: {
  [key: string]: {
    hash: string
  }
} = {}

export let soundEvents: {
  [key: string]: {
    sounds: (string | { name: string })[]
  }
} = {}

export const sounds: SoundConfig[] = []

main()

async function main() {
  const manifest = await getJson('https://launchermeta.mojang.com/mc/game/version_manifest.json')
  const version = await getJson(manifest.versions.find((v: any) => v.id === manifest.latest.snapshot).url)
  assetObjects = (await getJson(version.assetIndex.url)).objects
  soundEvents = await (await getResource(assetObjects['minecraft/sounds.json'].hash)).json()
  soundsListEl.innerHTML = Object.keys(soundEvents).map(s => `<option>${s}</option>`).join('')

  mainControlsEl.append($('input').class('sound-search').onChange(v => addSoundConfig(v))
    .attr('type', 'text').attr('list', 'sound-list').attr('placeholder', 'Search sounds').get())

  mainControlsEl.append($('button').onClick(() => (Howler as any).stop())
    .text('Stop all').icon('mute').get())

  const params: { [key: string]: string } = location.search.slice(1).split('&')
    .map(p => p.split('=')).reduce((acc, p) => ({...acc, [p[0]]: p[1]}), {})

  if (params.sound) {
    addSoundConfig(params.sound,
      Math.max(0.5, Math.min(2, parseFloat(params.pitch ?? '1'))),
      Math.max(0, Math.min(1, parseFloat(params.volume ?? '1'))))
  }
}

function addSoundConfig(sound: string, pitch?: number, volume?: number) {
  const soundEl = $('div').class('sound-config').get()
  const soundConfig = new SoundConfig(soundEl, sound, pitch, volume)
  soundConfigsEl.prepend(soundEl)
  ;(document.querySelector('.sound-search') as any).value = ''
  sounds.push(soundConfig)
}

export async function getJson(url: string) {
  const res = await fetch(url)
  return await res.json()
}

export async function getResource(hash: string) {
  return await getCachedData(getResourceUrl(hash))
}

export function getResourceUrl(hash: string) {
  const url = `https://resources.download.minecraft.net/${hash.slice(0, 2)}/${hash}`
  return `https://misode-cors-anywhere.herokuapp.com/${url}`
}

export async function getCachedData(url: string): Promise<Response> {
  const cache = await caches.open('sounds-v1')
  const cacheResponse = await cache.match(url)

  if (cacheResponse && cacheResponse.ok) {
    return cacheResponse
  }

  const fetchResponse = await fetch(url)
  await cache.put(url, fetchResponse.clone())
  return fetchResponse
}
