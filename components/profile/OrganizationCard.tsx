type OrganizationCardProps = {
  name: string;
  industry: string;
  description: string;
  location?: string | null;
};

export default function OrganizationCard({
  name,
  industry,
  description,
  location,
}: OrganizationCardProps) {
  return (
    <div className="rounded-lg border p-6 shadow-sm">
      <h3 className="text-lg font-semibold">{name}</h3>
      <p className="text-sm text-slate-600">{industry}</p>
      {location && <p className="text-xs text-slate-400">{location}</p>}
      <p className="mt-3 text-sm">{description}</p>
    </div>
  );
}
