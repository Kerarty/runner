import './style.css'
import { Game } from './core/Game'

const canvas = document.createElement('canvas')
canvas.width = 640          // portrait как на телефоне
canvas.height = 960
canvas.style.maxWidth = '100%'
canvas.style.maxHeight = '100%'
document.body.style.margin = '0'
document.body.style.background = '#000'
document.body.style.display = 'flex'
document.body.style.justifyContent = 'center'
document.body.style.alignItems = 'center'
document.body.appendChild(canvas)

const game = new Game(canvas)
game.start()

// Tap / click / space
const handleInput = () => game.handleInput()
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); handleInput() })
canvas.addEventListener('click', handleInput)
window.addEventListener('keydown', (e) => { if (e.key === ' ') handleInput() })