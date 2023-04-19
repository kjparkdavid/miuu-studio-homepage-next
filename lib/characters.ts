import miuu from "@/public/images/characterThumbnails/miuu.png";
import miyomi from "@/public/images/characterThumbnails/miyomi.png";
import kao from "@/public/images/characterThumbnails/kao.png";
import kiki from "@/public/images/characterThumbnails/kiki.png";
import joysky from "@/public/images/characterThumbnails/joysky.png";
import whispurr from "@/public/images/characterThumbnails/whispurr.png";
import nunu from "@/public/images/characterThumbnails/nunu.png";
import bunsy from "@/public/images/characterThumbnails/bunsy.png";

export interface Character {
  id: CharacterId;
  name: string;
}

export enum CharacterId {
  MIUU = "MIUU",
  MIYOMI = "MIYOMI",
  KAO = "KAO",
  KIKI = "KIKI",
  JOYSKY = "JOYSKY",
  WHISPURR = "WHISPURR",
  NUNU = "NUNU",
  BUNSY = "BUNSY",
}

export function getAllCharacters(): Array<Character> {
  return [
    {
      id: CharacterId.MIUU,
      name: "Miuu",
    },
    {
      id: CharacterId.MIYOMI,
      name: "Miyomi",
    },
    {
      id: CharacterId.KAO,
      name: "Kao",
    },
    {
      id: CharacterId.KIKI,
      name: "Kiki",
    },
    {
      id: CharacterId.JOYSKY,
      name: "Joy & Sky",
    },
    {
      id: CharacterId.WHISPURR,
      name: "Whispurr",
    },
    {
      id: CharacterId.NUNU,
      name: "Nunu",
    },
    {
      id: CharacterId.BUNSY,
      name: "Bunsy",
    },
  ];
}

export const getCharacteThumbnail = (id: CharacterId) => {
  switch (id) {
    case CharacterId.MIUU:
      return miuu;
    case CharacterId.MIYOMI:
      return miyomi;
    case CharacterId.KAO:
      return kao;
    case CharacterId.KIKI:
      return kiki;
    case CharacterId.JOYSKY:
      return joysky;
    case CharacterId.WHISPURR:
      return whispurr;
    case CharacterId.NUNU:
      return nunu;
    case CharacterId.BUNSY:
      return bunsy;
    default:
      return miuu;
  }
};
