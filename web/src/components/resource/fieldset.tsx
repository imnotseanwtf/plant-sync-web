/** A bordered section with a legend, like Filament's `Fieldset`. */
export function Fieldset({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className='bg-card rounded-xl border p-6 shadow-xs'>
      <legend className='px-2 text-sm font-medium'>{legend}</legend>
      <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>{children}</div>
    </fieldset>
  );
}
