set $pattern = 0xDEADBEEF

set $stack_start = 0
set $stack_end = 0
set $top_symbol_found = 0
set $limit_symbol_found = 0

printf "=== Stack High-water Analysis ===\n"
printf "=================================\n\n"

# Dynamically find the stack limits
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

if $top_symbol_found == 0
    printf "Error: Unable to find stack start symbol"
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

if $limit_symbol_found == 0
    printf "Error: Unable to find stack limit symbol"
end

if $top_symbol_found == 1 && $limit_symbol_found == 1
    set $current = $stack_end
    set $level = $current

    # The stack usage calculator won't be exactly correct to the byte because of the
    # safety_buffer used in the stack painter

    while $current < $sp
        if *(int)$current != $pattern
            set $level = $current
            set $current = $sp
            loop_break
        end
        set $current = $current + 4
    end

    set $stack_used = $stack_start - (int)$level
    set $stack_remaining = (int)$level - $stack_end
    set $stack_total = $stack_start - $stack_end
    set $percent_used = ($stack_used * 100) / $stack_total

    printf "Stack Start: 0x%08x\n", $stack_start
    printf "Current SP:  0x%08x\n", $sp
    printf "Stack End:   0x%08x\n", $stack_end
    printf "Total Stack: %d bytes\n", $stack_total
    printf "Max Usage:   %d bytes (%d%%)\n", $stack_used, $percent_used
    printf "Remaining:   %d bytes\n\n", $stack_remaining
end
