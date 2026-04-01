type ProfileHeaderProps = {
  username: string;
  bio?: string;
};

export default function ProfileHeader({
  username,
  bio,
}: ProfileHeaderProps) {
  return (
    <section className="mb-4">
      <h2 className="text-[15px] font-semibold text-black">
        {username}
      </h2>

      {bio && (
        <p className="mt-1 text-[13px] text-[#262626] leading-snug">
          {bio}
        </p>
      )}
    </section>
  );
}
