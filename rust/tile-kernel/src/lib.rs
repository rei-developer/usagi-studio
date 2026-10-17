fn group(id: u32) -> u32 {
    if (48..384).contains(&id) {
        id / 48 * 48
    } else {
        id
    }
}

fn fill(data: &[u32], width: usize, start: usize, output: &mut [u32]) -> usize {
    let mut visited = vec![false; data.len()];
    let target = group(data[start]);
    let mut head = 0;
    let mut tail = 1;
    visited[start] = true;
    output[0] = start as u32;
    while head < tail {
        let index = output[head] as usize;
        head += 1;
        let neighbors = [
            index.checked_sub(width),
            (index + width < data.len()).then_some(index + width),
            (index % width > 0).then(|| index - 1),
            (index % width + 1 < width).then_some(index + 1),
        ];
        for next in neighbors.into_iter().flatten() {
            if !visited[next] {
                visited[next] = true;
                if group(data[next]) == target {
                    output[tail] = next as u32;
                    tail += 1;
                }
            }
        }
    }
    tail
}

fn autotile(data: &[u32], width: usize, index: usize) -> u32 {
    let id = data[index];
    if !(48..384).contains(&id) {
        return id;
    }
    let group = id / 48;
    let x = (index % width) as isize;
    let y = (index / width) as isize;
    let height = data.len() / width;
    let connected = |dx: isize, dy: isize| {
        let nx = x + dx;
        let ny = y + dy;
        nx >= 0
            && ny >= 0
            && nx < width as isize
            && ny < height as isize
            && data[ny as usize * width + nx as usize] / 48 == group
    };
    let n = connected(0, -1);
    let e = connected(1, 0);
    let s = connected(0, 1);
    let w = connected(-1, 0);
    let mut bits = (if n { 2 } else { 0 })
        + (if e { 16 } else { 0 })
        + (if s { 64 } else { 0 })
        + (if w { 8 } else { 0 });
    if n && w && connected(-1, -1) {
        bits += 1;
    }
    if n && e && connected(1, -1) {
        bits += 4;
    }
    if s && w && connected(-1, 1) {
        bits += 32;
    }
    if s && e && connected(1, 1) {
        bits += 128;
    }
    let variant = match bits {
        254 => 1,
        251 => 2,
        250 => 3,
        127 => 4,
        126 => 5,
        123 => 6,
        122 => 7,
        223 => 8,
        222 => 9,
        219 => 10,
        218 => 11,
        95 => 12,
        94 => 13,
        91 => 14,
        90 => 15,
        214 => 16,
        210 => 17,
        86 => 18,
        82 => 19,
        248 => 20,
        120 => 21,
        216 => 22,
        88 => 23,
        107 => 24,
        75 => 25,
        106 => 26,
        74 => 27,
        31 => 28,
        30 => 29,
        27 => 30,
        26 => 31,
        66 => 32,
        24 => 33,
        208 => 34,
        80 => 35,
        104 => 36,
        72 => 37,
        11 => 38,
        10 => 39,
        22 => 40,
        18 => 41,
        64 => 42,
        16 => 43,
        2 => 44,
        8 => 45,
        0 => 46,
        255 => 0,
        _ => unreachable!(),
    };
    group * 48 + variant
}

// The JS adapter owns these exact-length buffers until free is called.
#[no_mangle]
pub extern "C" fn alloc(length: usize) -> *mut u32 {
    Box::into_raw(vec![0u32; length].into_boxed_slice()) as *mut u32
}

#[no_mangle]
pub unsafe extern "C" fn free(pointer: *mut u32, length: usize) {
    drop(Box::from_raw(std::ptr::slice_from_raw_parts_mut(
        pointer, length,
    )));
}

#[no_mangle]
pub unsafe extern "C" fn connected_area(
    input: *const u32,
    width: usize,
    height: usize,
    start: usize,
    output: *mut u32,
) -> usize {
    let length = width * height;
    if width == 0 || start >= length {
        return 0;
    }
    fill(
        std::slice::from_raw_parts(input, length),
        width,
        start,
        std::slice::from_raw_parts_mut(output, length),
    )
}

#[no_mangle]
pub unsafe extern "C" fn autotile_batch(
    input: *const u32,
    width: usize,
    height: usize,
    indices: *const u32,
    count: usize,
    output: *mut u32,
) {
    let data = std::slice::from_raw_parts(input, width * height);
    let indices = std::slice::from_raw_parts(indices, count);
    let output = std::slice::from_raw_parts_mut(output, count);
    for (i, index) in indices.iter().enumerate() {
        output[i] = autotile(data, width, *index as usize);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn fill_groups_and_edges() {
        let mut output = vec![0; 6];
        assert_eq!(fill(&[94, 48, 0, 0, 0, 0], 3, 0, &mut output), 2);
        assert_eq!(&output[..2], &[0, 1]);
        assert_eq!(autotile(&[94], 1, 0), 94);
        assert_eq!(autotile(&[94, 94], 2, 0), 91);
    }
}
