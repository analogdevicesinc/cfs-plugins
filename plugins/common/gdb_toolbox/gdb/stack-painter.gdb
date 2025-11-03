set $start = $sp
set $pattern = 0xDEADBEEF

set $top_symbol_found = 0
set $limit_symbol_found = 0

if &__StackTop != 0
    set $stack_start = (unsigned int)&__StackTop
    set $top_symbol_found = 1
end

if $top_symbol_found == 0
    if &__stack != 0
        set $stack_start = (unsigned int)&__stack
        set $top_symbol_found = 1
    end
end

if &__StackLimit != 0
    set $stack_end = (unsigned int)&__StackLimit
    set $limit_symbol_found = 1
end

# Alternative stack limit symbols
if $limit_symbol_found == 0
    if &__stack_limit != 0
        set $stack_end = (unsigned int)&__stack_limit
        set $limit_symbol_found = 1
    end
end

if $top_symbol_found == 1 && $limit_symbol_found == 1
    # Set an offset from the stack pointer to avoid overwriting the active frame
    set $safety_buffer = 64
    set $current = $start - $safety_buffer

    if $current > $stack_end && $current < $stack_start
        printf "Painting 0x%08x to 0x%08x\n", $start, $stack_end
        while $current >= $stack_end
            set *(int)$current = $pattern
            set $current = $current - 4
        end
        printf "Finished painting stack\n"
    else
        printf "Error: Stack pointer outside of stack limits"
    end
else
    printf "Error: Unable to find stack limits"
end
