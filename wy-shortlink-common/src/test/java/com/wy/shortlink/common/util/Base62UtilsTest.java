package com.wy.shortlink.common.util;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class Base62UtilsTest {

    @Test
    void encodeZero_returnsFirstChar() {
        assertEquals("0", Base62Utils.encode(0L));
    }

    @Test
    void encodeOne_returnsSecondChar() {
        assertEquals("1", Base62Utils.encode(1L));
    }

    @Test
    void encode61_returnsLastChar() {
        assertEquals("Z", Base62Utils.encode(61L));
    }

    @Test
    void encode62_returnsTwoChars() {
        assertEquals("10", Base62Utils.encode(62L));
    }

    @Test
    void encodeAndDecode_roundTrip() {
        long id = 123456789L;
        String code = Base62Utils.encode(id);
        assertEquals(id, Base62Utils.decode(code));
    }

    @Test
    void encodeDecode_zero() {
        assertEquals(0L, Base62Utils.decode(Base62Utils.encode(0L)));
    }

    @Test
    void encodeDecode_maxLong() {
        assertEquals(Long.MAX_VALUE, Base62Utils.decode(Base62Utils.encode(Long.MAX_VALUE)));
    }
}
