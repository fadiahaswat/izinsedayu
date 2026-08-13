import os, zlib, struct

os.makedirs('Enhance UI and UX Design V2/src/assets', exist_ok=True)
os.makedirs('assets', exist_ok=True)

def process_logo(filename):
    with open(filename, 'rb') as f:
        content = f.read()
    pos = 8
    idat_chunks = []
    color_type = 6
    width = height = 0
    while pos < len(content):
        length, type_ = struct.unpack('>I4s', content[pos:pos+8])
        pos += 8
        data = content[pos:pos+length]
        pos += length + 4
        if type_ == b'IHDR':
            width, height, bit_depth, color_type, compression, filter_method, interlace = struct.unpack('>IIBBBBB', data)
            print(f'Original size: {width}x{height}')
        elif type_ == b'IDAT':
            idat_chunks.append(data)
        elif type_ == b'IEND':
            break

    decompressed = zlib.decompress(b''.join(idat_chunks))
    bpp = 4 if color_type == 6 else 3
    stride = width * bpp + 1

    blue_raw = bytearray()
    white_raw = bytearray()

    prev_line = bytearray(width * bpp)
    for y in range(height):
        line = bytearray(decompressed[y*stride + 1 : (y+1)*stride])
        filter_type = decompressed[y*stride]
        for x in range(width * bpp):
            recon = line[x]
            if filter_type == 1:
                if x >= bpp: recon = (recon + line[x - bpp]) % 256
            elif filter_type == 2:
                recon = (recon + prev_line[x]) % 256
            elif filter_type == 3:
                a = line[x - bpp] if x >= bpp else 0
                b = prev_line[x]
                recon = (recon + (a + b) // 2) % 256
            elif filter_type == 4:
                a = line[x - bpp] if x >= bpp else 0
                b = prev_line[x]
                c = prev_line[x - bpp] if x >= bpp else 0
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                pr = a if pa <= pb and pa <= pc else (b if pb <= pc else c)
                recon = (recon + pr) % 256
            line[x] = recon
        prev_line = line

        blue_line = bytearray([0])
        white_line = bytearray([0])
        for x in range(width):
            idx = x * bpp
            r, g, b = line[idx], line[idx+1], line[idx+2]
            a = line[idx+3] if bpp == 4 else 255
            # Make white/near-white background transparent
            if r > 235 and g > 235 and b > 235:
                alpha = 0
            else:
                alpha = a
            blue_line.extend([37, 99, 235, alpha])
            white_line.extend([255, 255, 255, alpha])

        blue_raw.extend(blue_line)
        white_raw.extend(white_line)

    def write_png(out_file, w, h, raw_data):
        compressed = zlib.compress(raw_data, 6)
        ihdr = struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0)
        def make_chunk(ctype, cdata):
            crc = zlib.crc32(ctype + cdata) & 0xffffffff
            return struct.pack('>I', len(cdata)) + ctype + cdata + struct.pack('>I', crc)
        with open(out_file, 'wb') as f:
            f.write(b'\x89PNG\r\n\x1a\n')
            f.write(make_chunk(b'IHDR', ihdr))
            f.write(make_chunk(b'IDAT', compressed))
            f.write(make_chunk(b'IEND', b''))
        print(f'Written: {out_file}')

    write_png("Enhance UI and UX Design V2/src/assets/logo-muallimin-blue.png", width, height, blue_raw)
    write_png("Enhance UI and UX Design V2/src/assets/logo-muallimin-white.png", width, height, white_raw)
    write_png("assets/logo-muallimin-blue.png", width, height, blue_raw)
    write_png("assets/logo-muallimin-white.png", width, height, white_raw)

process_logo("Mu'allimin Hijau Kuning - Latar Terang.png")
