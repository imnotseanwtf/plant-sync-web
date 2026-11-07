/**
 * Pump-on readings closer together than this belong to one watering. The firmware posts an "off"
 * reading between every "on" one, and a device can report slowly or drop offline mid-cycle.
 */
// ponytail: fixed gap, so two real waterings within 30 min merge; make it per-plant if that matters.
export const IRRIGATION_GAP_MINUTES = 30;
