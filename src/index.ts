/**
 * WHY: Public entry for @meoslabs/save-in-meos — mdp codec + widget initialisers.
 * WHAT: Re-exports ImportIntentV1 types, codec functions, and widget API.
 * WHERE: npm package root (`import from '@meoslabs/save-in-meos'`).
 */

export {
  MDP_CONTRACT_VERSION,
  MEOS_DO_HOST,
  DATABOX_IMPORT_RESOURCE,
  MDP_MAX_QR_URL_LENGTH,
  type ImportIntentTier,
  type ImportIntentKind,
  type ImportIntentV1,
  type ImportIntentInput,
  type BuildMeosLinkOptions,
  MdpEncodeError,
  MdpDecodeError,
  encodeImportIntentV1,
  decodeImportIntentV1,
  buildImportIntentV1,
  selectImportTier,
  buildMeosLink,
  decodeMeosLink,
  parseWidgetAttribution,
} from "./import-intent-v1.js"

export {
  initSaveButton,
  ensureWidgetStyles,
  buildSaveChipMarkup,
  MEOS_SAVE_LABEL,
  MEOS_SAVE_CHIP_CLASS,
  MEOS_SAVE_ICON_CLASS,
  MEOS_SAVE_LABEL_CLASS,
  type SaveButtonOptions,
} from "./widget/index.js"
