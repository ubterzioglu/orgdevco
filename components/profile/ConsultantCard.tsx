type ConsultantCardProps = {
  name: string;
  title: string;
  bio: string;
  expertise: string[];
  location?: string | null;
};

export default function ConsultantCard({
  name,
  title,
  bio,
  expertise,
  location,
}: ConsultantCardProps) {
  return (
    <div className="rounded-lg border p-6 shadow-sm">
      <h3 className="text-lg font-semibold">{name}</h3>
      <p className="text-sm text-slate-600">{title}</p>
      {location && <p className="text-xs text-slate-400">{location}</p>}
      <p className="mt-3 text-sm">{bio}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {expertise.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-slate-100 px-3 py-1 text-xs"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
