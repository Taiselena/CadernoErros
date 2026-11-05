/** Caricatura da Tais Elena: pele parda, olhos pretos, rosto oval com maxilar
 *  marcado, cabelo cacheado castanho-escuro, magra, vestido preto. */
export function Caricatura({ className }: { className?: string }) {
  const pele = '#b57b52';
  const sombra = '#93603d';
  const cabelo = '#3a2219';
  const cabeloClaro = '#5c3826';
  const cachosFundo: [number, number, number][] = [
    [62, 92, 30], [158, 92, 30], [70, 62, 28], [150, 62, 28], [110, 40, 33], [86, 44, 27], [134, 44, 27],
    [54, 124, 26], [166, 124, 26], [58, 154, 23], [162, 154, 23], [66, 180, 19], [154, 180, 19], [76, 196, 13], [144, 196, 13],
  ];
  const franja: [number, number, number][] = [[89, 67, 13], [103, 60, 13], [118, 60, 13], [132, 67, 13], [80, 81, 11], [141, 81, 11], [77, 96, 8], [143, 96, 8]];
  return (
    <svg viewBox="0 0 220 260" className={className} role="img" aria-label="Caricatura da Tais Elena">
      <circle cx="110" cy="138" r="104" fill="#fde1ee" />
      <circle cx="110" cy="138" r="104" fill="none" stroke="#f3c3db" strokeWidth="2" strokeDasharray="2 7" strokeLinecap="round" />
      {/* brilhos */}
      <path d="M190 54 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z" fill="#b48ae6" />
      <path d="M28 70 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill="#e0619f" />
      <path d="M196 170 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill="#e0619f" opacity=".7" />

      {/* cabelo atrás */}
      <g fill={cabelo}>{cachosFundo.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} />)}</g>
      <g fill="none" stroke={cabeloClaro} strokeWidth="2.4" strokeLinecap="round" opacity=".9">
        <path d="M48 118 q8 -8 14 2" /><path d="M160 112 q8 -6 14 4" /><path d="M52 150 q7 -7 13 1" /><path d="M156 148 q7 -6 12 2" />
        <path d="M64 58 q8 -9 16 0" /><path d="M140 56 q8 -9 16 0" /><path d="M100 30 q10 -8 20 0" /><path d="M60 178 q6 -6 12 1" /><path d="M150 178 q6 -6 12 1" />
      </g>

      {/* vestido preto */}
      <path d="M44 260 C46 214 66 192 96 184 L124 184 C154 192 174 214 176 260 Z" fill="#1d1420" />
      <path d="M66 205 C72 196 84 190 96 186" stroke="#3b2d40" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* pescoço e decote */}
      <rect x="99" y="138" width="22" height="50" rx="9" fill={pele} />
      <path d="M95 184 Q110 210 125 184 Z" fill={pele} />
      <ellipse cx="110" cy="148" rx="13" ry="7" fill={sombra} opacity=".55" />
      {/* colar delicado */}
      <path d="M98 186 Q110 200 122 186" fill="none" stroke="#d9a640" strokeWidth="1.4" />
      <circle cx="110" cy="196" r="2.4" fill="#d9a640" />

      {/* orelhas e argolas */}
      <ellipse cx="81" cy="106" rx="5.5" ry="8" fill={sombra} />
      <ellipse cx="139" cy="106" rx="5.5" ry="8" fill={sombra} />
      <circle cx="80" cy="119" r="5" fill="none" stroke="#d9a640" strokeWidth="2" />
      <circle cx="140" cy="119" r="5" fill="none" stroke="#d9a640" strokeWidth="2" />

      {/* rosto oval com maxilar marcado */}
      <path d="M81 100 C81 71 94 58 110 58 C126 58 139 71 139 100 C139 119 135 131 128 140 C121 147 115 150 110 150 C105 150 99 147 92 140 C85 131 81 119 81 100 Z" fill={pele} />
      <path d="M86 128 C90 137 96 144 104 148" stroke={sombra} strokeWidth="1.6" fill="none" opacity=".55" strokeLinecap="round" />
      <path d="M134 128 C130 137 124 144 116 148" stroke={sombra} strokeWidth="1.6" fill="none" opacity=".55" strokeLinecap="round" />

      {/* sobrancelhas */}
      <path d="M90 92 Q97 87.5 104 90.5" stroke="#24140d" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      <path d="M116 90.5 Q123 87.5 130 92" stroke="#24140d" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      {/* olhos pretos */}
      <ellipse cx="97.5" cy="103" rx="5" ry="5.8" fill="#170d0b" />
      <ellipse cx="122.5" cy="103" rx="5" ry="5.8" fill="#170d0b" />
      <circle cx="99.2" cy="101" r="1.7" fill="#fff" />
      <circle cx="124.2" cy="101" r="1.7" fill="#fff" />
      <path d="M91.5 99 l-2.6 -2 M103 98.5 l2 -2" stroke="#170d0b" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M128.5 99 l2.6 -2 M117 98.5 l-2 -2" stroke="#170d0b" strokeWidth="1.5" strokeLinecap="round" />
      {/* nariz */}
      <path d="M110.5 107 Q108.5 116 105.5 119 Q110 121.5 114.5 119" stroke={sombra} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* bochechas */}
      <ellipse cx="91" cy="119" rx="7" ry="4" fill="#e66f95" opacity=".32" />
      <ellipse cx="129" cy="119" rx="7" ry="4" fill="#e66f95" opacity=".32" />
      {/* sorriso */}
      <path d="M100.5 128.5 Q110 138 119.5 128.5 Q110 132.5 100.5 128.5 Z" fill="#8a3a45" />
      <path d="M103.5 130.2 Q110 132.6 116.5 130.2" stroke="#fff" strokeWidth="1.4" fill="none" opacity=".8" strokeLinecap="round" />

      {/* franja de cachos */}
      <g fill={cabelo}>{franja.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} />)}</g>
      <g fill="none" stroke={cabeloClaro} strokeWidth="2.2" strokeLinecap="round">
        <path d="M83 64 q6 -6 12 0" /><path d="M98 56 q6 -6 11 0" /><path d="M113 56 q6 -6 11 0" /><path d="M127 63 q6 -6 11 1" /><path d="M75 79 q5 -5 10 0" /><path d="M136 79 q5 -5 10 0" />
      </g>
    </svg>
  );
}
