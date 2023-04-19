import { Character, getCharacteThumbnail } from "@/lib/characters";
import Image from "next/image";

const CharacterThumbnail = (character: Character) => {
  const { id, name } = character;

  return (
    <div className="rounded-xl border-2 border-[#423224]">
      <Image
        className="w-full rounded-t-xl"
        src={getCharacteThumbnail(id)}
        alt={name}
      />
      <p className="text-center my-2 font-bold text-sm">{name}</p>
    </div>
  );
};

export default CharacterThumbnail;
