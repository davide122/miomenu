import QRCode from "qrcode"

export async function qrDataUrl(text: string) {
  return await QRCode.toDataURL(text, {
    margin: 1,
    width: 512,
    color: {
      dark: "#111827",
      light: "#FFFFFF"
    }
  })
}

