import { Howler } from 'howler';
import $ from './Element'
import { SoundConfig } from './SoundConfig';
import "./styles.css";

const mainControlsEl = document.getElementById('main-controls') as HTMLDivElement
const soundConfigsEl = document.getElementById('sound-configs') as HTMLDivElement
const soundsListEl = document.getElementById('sound-list') as HTMLDataListElement

export let manifest: {
  latest: {
    release: string,
    snapshot: string
  },
  versions: {
    id: string,
    type: string,
    url: string,
  }[]
}

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

const sounds: SoundConfig[] = []
let soundTimeouts: any[] = []

main()

async function main() {
  manifest = await getJson('https://launchermeta.mojang.com/mc/game/version_manifest.json')

  const versionSelect = $('select').class('version').onChange(v => {
    localStorage.setItem('minecraft_sounds_version', v)
    loadVersion(v)
  }).get() as HTMLSelectElement
  versionSelect.append($('option').value('latest').text(manifest.latest.snapshot).get())
  ;['1.16.5', '1.15.2', '1.14.4', '1.13.2', '1.12.2'].forEach((v: any) => {
      versionSelect.append($('option').value(v).text(v).get())
    })
  mainControlsEl.append(versionSelect)

  mainControlsEl.append($('input').class('sound-search').onChange(v => addSoundConfig(v))
    .attr('type', 'text').attr('list', 'sound-list').attr('placeholder', 'Search sounds').get())

  mainControlsEl.append($('button').text('Play all').icon('play')
    .onClick(() => {
      stopAll()
      sounds.forEach(s => {
        soundTimeouts.push(setTimeout(() => s.play(), 50 * s.getOffset()))
      })
    }).get())

  mainControlsEl.append($('button').text('Stop all').icon('mute')
    .onClick(stopAll).get())

  const params: { [key: string]: string } = location.search.slice(1).split('&')
    .map(p => p.split('=')).reduce((acc, p) => ({...acc, [p[0]]: p[1]}), {})

  if (params.sound) {
    addSoundConfig(params.sound,
      Math.max(0.5, Math.min(2, parseFloat(params.pitch ?? '1'))),
      Math.max(0, Math.min(1, parseFloat(params.volume ?? '1'))))
  }

  versionSelect.value = localStorage.getItem('minecraft_sounds_version') ?? 'latest'
  loadVersion(versionSelect.value)
}

async function loadVersion(id: string) {
  if (id === 'latest') {
    id = manifest.latest.snapshot
  }
  const version = await getJson(manifest.versions.find(v => v.id === id)!.url)

  assetObjects = (await getJson(version.assetIndex.url)).objects
  soundEvents = await (await getResource(assetObjects['minecraft/sounds.json'].hash)).json()

  soundsListEl.innerHTML = ''
  Object.entries(soundEvents).forEach(([k, v]) => {
      if (v.sounds.length > 0) {
        soundsListEl.append($('option').text(k).get())
      }
    })
}

function addSoundConfig(sound: string, pitch?: number, volume?: number) {
  const soundEl = $('div').class('sound-config').get()
  const soundConfig = new SoundConfig(soundEl, sound, pitch, volume)
  soundConfigsEl.prepend(soundEl)
  ;(document.querySelector('.sound-search') as any).value = ''
  sounds.push(soundConfig)
}

export function removeSoundConfig(config: SoundConfig) {
  const soundIndex = sounds.indexOf(config)
  if (soundIndex >= 0) {
    sounds.splice(soundIndex, 1)[0].el.remove()
  }
}

function stopAll() {
  soundTimeouts.forEach(t => clearTimeout(t))
  soundTimeouts = []
  sounds.forEach(s => s.stop())
  ;(Howler as any).stop()
}

async function getJson(url: string) {
  const res = await fetch(url)
  return await res.json()
}

async function getResource(hash: string) {
  return await getCachedData(getResourceUrl(hash))
}

export function getResourceUrl(hash: string) {
  const url = `https://resources.download.minecraft.net/${hash.slice(0, 2)}/${hash}`
  return `https://misode-cors-anywhere.herokuapp.com/${url}`
}

async function getCachedData(url: string): Promise<Response> {
  const cache = await caches.open('sounds-v1')
  const cacheResponse = await cache.match(url)

  if (cacheResponse && cacheResponse.ok) {
    return cacheResponse
  }

  const fetchResponse = await fetch(url)
  await cache.put(url, fetchResponse.clone())
  return fetchResponse
}
