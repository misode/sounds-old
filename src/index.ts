import { Howler } from 'howler';
import $ from './Element'
import { SoundConfig } from './SoundConfig';
import "./styles.css";

const stopButtonEl = document.getElementById('stop-button') as HTMLButtonElement
const soundSearchEl = document.getElementById('sound-search') as HTMLInputElement
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

  soundSearchEl.addEventListener('change', () => {
    addSoundConfig(soundSearchEl.value)
  })

  stopButtonEl.addEventListener('click', () => {
    (Howler as any).stop()
  })

  addSoundConfig('entity.creeper.primed')
}

function addSoundConfig(sound: string) {
  const soundEl = $('div').class('sound-config').get()
  const soundConfig = new SoundConfig(soundEl, sound)
  soundConfigsEl.prepend(soundEl)
  soundSearchEl.value = ''
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
