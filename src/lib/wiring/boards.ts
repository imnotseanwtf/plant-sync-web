// Microcontroller boards a device can be built on. Client-safe (no server imports).

export type PinKind = 'gpio' | 'gnd' | '3v3' | '5v' | 'nc';

export type BoardPin = {
  /** Unique within the board; what a saved design refers to. */
  id: string;
  label: string;
  gpio?: number;
  kind: PinKind;
  /** Can be read with analogRead (on the ESP32 only ADC1 works while Wi-Fi is on). */
  analog?: boolean;
  /** Can't drive an output (relay IN, DHT data, I²C). */
  inputOnly?: boolean;
  /** Shown in the editor when the pin is picked. */
  warn?: string;
};

export type Board = {
  id: string;
  name: string;
  chip: string;
  /** Top to bottom, as printed on the board. */
  left: BoardPin[];
  right: BoardPin[];
};

const nc = (id: string, label = id): BoardPin => ({ id, label, kind: 'nc' });
const gnd = (n: number): BoardPin => ({ id: `GND.${n}`, label: 'GND', kind: 'gnd' });
const v3 = (n: number): BoardPin => ({
  id: n === 1 ? '3V3' : `3V3.${n}`,
  label: '3V3',
  kind: '3v3'
});
const gpio = (id: string, n: number, extra: Partial<BoardPin> = {}): BoardPin => ({
  id,
  label: id,
  gpio: n,
  kind: 'gpio',
  ...extra
});

const NODEMCU: Board = {
  id: 'nodemcu-v1',
  name: 'NodeMCU v1.0 (ESP8266)',
  chip: 'ESP-12E',
  left: [
    gpio('A0', 17, { analog: true, inputOnly: true }),
    nc('RSV.1', 'RSV'),
    nc('RSV.2', 'RSV'),
    nc('SD3'),
    nc('SD2'),
    nc('SD1'),
    nc('CMD'),
    nc('SD0'),
    nc('CLK'),
    gnd(1),
    v3(1),
    nc('EN'),
    nc('RST'),
    gnd(2),
    { id: 'VIN', label: 'VIN', kind: '5v' }
  ],
  right: [
    gpio('D0', 16),
    gpio('D1', 5),
    gpio('D2', 4),
    gpio('D3', 0, { warn: 'Boot pin: must stay HIGH at power-on.' }),
    gpio('D4', 2, { warn: 'Boot pin: must stay HIGH at power-on.' }),
    v3(2),
    gnd(3),
    gpio('D5', 14),
    gpio('D6', 12),
    gpio('D7', 13),
    gpio('D8', 15, { warn: 'Boot pin: must stay LOW at power-on.' }),
    gpio('RX', 3, { warn: 'Used by USB serial.' }),
    gpio('TX', 1, { warn: 'Used by USB serial.' }),
    gnd(4),
    v3(3)
  ]
};

const adc1 = { analog: true };
const inOnly = { analog: true, inputOnly: true };
const strap = (why: string) => ({ warn: `Strapping pin: ${why}` });

const ESP32: Board = {
  id: 'esp32-devkit',
  name: 'ESP32 DevKit V1 (30 pin)',
  chip: 'ESP32-WROOM-32',
  left: [
    nc('EN'),
    gpio('VP', 36, inOnly),
    gpio('VN', 39, inOnly),
    gpio('D34', 34, inOnly),
    gpio('D35', 35, inOnly),
    gpio('D32', 32, adc1),
    gpio('D33', 33, adc1),
    gpio('D25', 25),
    gpio('D26', 26),
    gpio('D27', 27),
    gpio('D14', 14),
    gpio('D12', 12, strap('must be LOW at boot.')),
    gpio('D13', 13),
    gnd(1),
    { id: 'VIN', label: 'VIN', kind: '5v' }
  ],
  right: [
    gpio('D23', 23),
    gpio('D22', 22),
    gpio('TX0', 1, { warn: 'Used by USB serial.' }),
    gpio('RX0', 3, { warn: 'Used by USB serial.' }),
    gpio('D21', 21),
    gpio('D19', 19),
    gpio('D18', 18),
    gpio('D5', 5, strap('must be HIGH at boot.')),
    gpio('TX2', 17),
    gpio('RX2', 16),
    gpio('D4', 4),
    gpio('D2', 2, strap('must be LOW at boot.')),
    gpio('D15', 15, strap('must be HIGH at boot.')),
    gnd(2),
    v3(1)
  ]
};

export const BOARDS = [NODEMCU, ESP32] as const;
export const DEFAULT_BOARD_ID = NODEMCU.id;

export const boardById = (id: string): Board | undefined => BOARDS.find((b) => b.id === id);

export type PlacedPin = { pin: BoardPin; side: 'left' | 'right'; row: number };

/** Every pin of the board with the side and row it is printed on. */
export function boardPins(board: Board): PlacedPin[] {
  return [
    ...board.left.map((pin, row) => ({ pin, side: 'left' as const, row })),
    ...board.right.map((pin, row) => ({ pin, side: 'right' as const, row }))
  ];
}
