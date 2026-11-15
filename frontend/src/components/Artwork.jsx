import { Asterisk, Braces, Command, MoveUpRight } from 'lucide-react';

export default function Artwork({ theme = 'green', large = false }) {
  return <div aria-hidden="true" className={`artwork art-${theme} ${large ? 'art-large' : ''}`}>
    <div className="art-grain" />
    {theme === 'architecture' ? <>
      <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
      <div className="architecture"><div className="arch-block block-one" /><div className="arch-block block-two" /><div className="arch-block block-three" /><div className="arch-block block-four" /></div>
      <div className="art-label">FULL STACK DEVELOPMENT</div><Asterisk className="art-asterisk" size={44} strokeWidth={1.2} />
    </> : theme === 'green' ? <><div className="component-window"><div className="window-dots"><i /><i /><i /></div><Braces size={65} strokeWidth={1.1} /><span>React components</span></div><span className="art-caption">REACT COMPONENTS</span></> : theme === 'orange' ? <><div className="type-art"><span>Aa</span><div className="type-lines"><i /><i /><i /></div></div><span className="art-caption">TYPOGRAPHY & LAYOUT</span><div className="art-circle" /></> : theme === 'blue' ? <><div className="note-paper"><span>Dev notes</span><i /><i /><i /><i /><div className="paper-star">✳</div></div><span className="art-caption">LEARNING & DOCUMENTATION</span></> : theme === 'purple' ? <><div className="database-art"><i /><i /><i /><Command size={36} /></div><span className="art-caption">DATABASE DESIGN</span></> : <><div className="sun-art" /><div className="hill hill-one" /><div className="hill hill-two" /><MoveUpRight className="sand-arrow" size={52} strokeWidth={1} /><span className="art-caption">TRAVEL & EXPLORATION</span></>}
  </div>;
}
