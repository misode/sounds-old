import {Howl, Howler} from 'howler';
import "./styles.css";

const playButtonEl = document.getElementById('play-button') as HTMLButtonElement
const stopButtonEl = document.getElementById('stop-button') as HTMLButtonElement
const pitchEl = document.getElementById('pitch') as HTMLInputElement
const loopEl = document.getElementById('loop') as HTMLInputElement
const soundEl = document.getElementById('sound') as HTMLInputElement
const soundsListEl = document.getElementById('sound-list') as HTMLDataListElement

main()

async function main() {
  const manifest = await getJson('https://launchermeta.mojang.com/mc/game/version_manifest.json')
  const version = await getJson(manifest.versions.find((v: any) => v.id === manifest.latest.snapshot).url)
  const assets = await getJson(version.assetIndex.url)
  const sounds = await (await getResource(assets.objects['minecraft/sounds.json'].hash)).json()

  soundsListEl.innerHTML = Object.keys(sounds).map(s => `<option>${s}</option>`).join('')

  let howl: Howl | null = null

  pitchEl.addEventListener('change', () => {
    document.querySelector('label[for="pitch"]')!.textContent = `Pitch: ${pitchEl.value}`
    if (howl) {
      howl.rate(parseFloat(pitchEl.value))
    }
  })

  loopEl.addEventListener('change', () => {
    if (howl) {
      howl.loop(loopEl.checked)
    }
  })

  playButtonEl.addEventListener('click', () => {
    const soundEvent = sounds[soundEl.value]
    if (soundEvent) {
      const sound = soundEvent.sounds[0]
      const soundPath = typeof sound === 'string' ? sound : sound.name
      const hash = assets.objects[`minecraft/sounds/${soundPath}.ogg`].hash
      const url = `https://cors-anywhere.herokuapp.com/${getResourceUrl(hash)}`
      Howler.mute(false)
      if (howl) {
        howl.unload()
      }
      howl = new Howl({
        src: [url],
        format: ['ogg'],
        autoplay: true,
        rate: parseFloat(pitchEl.value),
        loop: loopEl.checked
      })
    }
  })

  stopButtonEl.addEventListener('click', () => {
    Howler.mute(true)
  })
}


async function getJson(url: string) {
  const res = await fetch(url)
  return await res.json()
}

async function getResource(hash: string) {
  const url = getResourceUrl(hash)
  return await getCachedData(`https://cors-anywhere.herokuapp.com/${url}`)
}

function getResourceUrl(hash: string) {
  return `https://resources.download.minecraft.net/${hash.slice(0, 2)}/${hash}`
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
