import OnlineRoom from './OnlineRoom'
import PrintableDeck from './PrintableDeck'

/** Um único desenho SVG é usado pelo multiplayer e pelo baralho físico. */
export default function App(){
  const printing=new URLSearchParams(window.location.search).get('baralho')==='imprimir'
  return printing?<PrintableDeck/>:<OnlineRoom/>
}
