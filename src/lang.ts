/// <reference path="utils.ts" />
/// <reference path="../morphdom/morphdom-umd.js" />

interface MorphDomOptions {
    getNodeKey?: (node: Node) => any;
    onBeforeNodeAdded?: (node: Node) => Node;
    onNodeAdded?: (node: Node) => Node;
    onBeforeElUpdated?: (fromEl: HTMLElement, toEl: HTMLElement) => boolean;
    onElUpdated?: (el: HTMLElement) => void;
    onBeforeNodeDiscarded?: (node: Node) => boolean;
    onNodeDiscarded?: (node: Node) => void;
    onBeforeElChildrenUpdated?: (fromEl: HTMLElement, toEl: HTMLElement) => boolean;
    childrenOnly?: boolean;
}

declare function morphdom(
    fromNode: Node,
    toNode: Node | string,
    options?: MorphDomOptions,
): void;

class Language {
    id: Identifier;
    name: string;
    rtl: boolean;

    constructor(id: Identifier, name: string, rtl: boolean) {
        this.id = id;
        this.name = name;
        this.rtl = rtl;
    }
}

class LanguageBank {
    languages: Language[];

    constructor(languages: Language[] = []) {
        this.languages = languages;
    }

    add(language: Language) {
        this.languages.push(language);
    }

    get(language_id: string): Language | null {
        for (const lang of this.languages) {
            if (lang.id.id === language_id) {
                return lang;
            }
        }
        return null;
    }
}

const lang_bank = new LanguageBank([
    new Language(new Identifier("en"), "English", false),
    new Language(new Identifier("fa"), "فارسی", true)
]);

interface MultilingualText {
    [language_id: string]: string;
};

interface TextBankData {
    [text_id: string]: MultilingualText;
}

class TextBank {
    current_language: Language;
    data: TextBankData;

    constructor(current_language: Language, data: TextBankData = {}) {
        this.current_language = current_language;
        this.data = data;

        for (const key in this.data) {
            ensure_valid_id(key);
        }
    }

    get(text_id: string): string {
        if (text_id === "-current-language") {
            return this.current_language.name;
        }
        if (text_id === "-current-language-id") {
            return this.current_language.id.id;
        }

        try {
            if (!this.data[text_id]) {
                throw new Error("non-existent text_id");
            }
            if (!this.data[text_id][this.current_language.id.id]) {
                throw new Error("no translation for the current language");
            }
            return this.data[text_id][this.current_language.id.id] as string;
        } catch (error) {
            console.error(error);
            if (this.current_language.id.id == "fa") {
                return "(خطا در تحلیل متن)";
            } else {
                return "(text resolution error)";
            }
        }
    }

    // replace every instance of @@text-id with the resolved value based on the
    // current language.
    resolve(text: string): string {
        for (let i = 0; i < text.length - 3;) {
            // find a '@@'
            if (text[i] !== '@' || text[i + 1] !== '@') {
                i++;
                continue;
            }

            // skip the '@@'
            let start_idx: number = i;
            i += 2;

            // read the following ID
            let text_id: string = "";
            if (valid_id_first_chars.includes(text[i])) {
                text_id = text[i];
                i++;

                while (i < text.length && valid_id_chars.includes(text[i])) {
                    text_id += text[i];
                    i++;
                }
            }
            let end_idx: number = i;

            // skip if it's invalid or empty
            if (!is_valid_id(text_id)) {
                continue;
            }

            // replace with the resolved value
            let resolved: string = this.get(text_id);
            text = replace_substring(
                text,
                start_idx,
                end_idx,
                resolved
            );

            // adjust the index because the resolved value might have a
            // different length.
            i += resolved.length - (end_idx - start_idx);
        }
        return text;
    }

    apply_to(elem: Element = document.documentElement) {
        morphdom(elem, this.resolve(elem.outerHTML));
    }
}

const text_bank = new TextBank(
    lang_bank.get("fa")!,
    {
        "title": {
            "en": "Prayer Pattern Generator",
            "fa": "الگوی صف نماز جماعت"
        },
        "tile": {
            "en": "Tile",
            "fa": "کادر"
        },
        "dimensions": {
            "en": "Dimensions",
            "fa": "ابعاد"
        },
        "thickness": {
            "en": "Thickness",
            "fa": "ضخامت"
        },
        "grid-lines": {
            "en": "Grid Lines",
            "fa": "خطوط کمکی"
        },
        "density": {
            "en": "Density",
            "fa": "تراکم"
        },
        "horizontal-lines": {
            "en": "Horizontal Lines",
            "fa": "خطوط افقی"
        },
        "vertical-lines": {
            "en": "Vertical Lines",
            "fa": "خطوط عمودی"
        },
        "masjad": {
            "en": "Masjad",
            "fa": "سجده‌گاه"
        },
        "position": {
            "en": "Position",
            "fa": "موقعیت"
        },
        "radius": {
            "en": "Radius",
            "fa": "شعاع"
        },
        "feet": {
            "en": "Feet",
            "fa": "پا‌ها"
        },
        "distance": {
            "en": "Distance",
            "fa": "فاصله"
        },
        "opacity": {
            "en": "Opacity",
            "fa": "شفافیت" //it's the opposite but it's cleaner
        },
        "transform": {
            "en": "Transform",
            "fa": "تبدیل خطی"
        },
        "scale": {
            "en": "Scale",
            "fa": "مقیاس"
        },
        "skew": {
            "en": "Skew",
            "fa": "کجی"
        },
        "rotation": {
            "en": "Rotation",
            "fa": "چرخش"
        },
        "offset": {
            "en": "Offset",
            "fa": "انحراف"
        },
        "bg-color": {
            "en": "Background Color",
            "fa": "رنگ پس‌زمینه"
        },
        "pattern-color": {
            "en": "Pattern Color",
            "fa": "رنگ الگو"
        },
        "hue": {
            "en": "Hue",
            "fa": "رنگ"
        },
        "saturation": {
            "en": "Saturation",
            "fa": "اشباع"
        },
        "value": {
            "en": "Value",
            "fa": "مقدار"
        },
        "hide": {
            "en": "Hide",
            "fa": "پنهان کن"
        },
        "import": {
            "en": "Import",
            "fa": "وارد کن"
        },
        "export": {
            "en": "Export",
            "fa": "صادر کن"
        },
        "reset-all": {
            "en": "Reset All",
            "fa": "ریست کن"
        },
        "webgl2-not-supported": {
            "en": "WebGL2 is not supported.",
            "fa": "مرورگر یا دستگاه شما از WebGL2 پشتیبانی نمی‌کند."
        },
        "px": {
            "en": "px",
            "fa": "پیکسل"
        }
    }
);
