printf "=== Stack Analysis ===\n"
printf "======================\n\n"

printf "Current PC: 0x%08x\n", $pc
printf "Current SP: 0x%08x\n", $sp
printf "Current FP: 0x%08x\n", $fp
printf "\n"

set $bottom_sp = $sp
up-silently 100000

# while $sp >= $bottom_sp
while 1
    printf "=== Frame ==="
    printf "Stack pointer: 0x%08x\n", $sp
    info frame
    printf "\n"
    printf "Arguments:\n"
    info args
    printf "\n"
    printf "Local variables:\n"
    info locals
    printf "\n"

    if $sp <= $bottom_sp
        loop_break
    end

    down-silently
end

printf "=== Stack ===\n"
set $stack_start = 0
set $stack_end = 0
set $top_symbol_found = 0
set $limit_symbol_found = 0

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
    set $stack_used = $stack_start - (int)$bottom_sp
    set $stack_remaining = (int)$bottom_sp - $stack_end
    set $stack_total = $stack_start - $stack_end

    printf "Stack Start:   0x%08x\n", $stack_start
    printf "Current SP:    0x%08x\n", $bottom_sp
    printf "Stack End:     0x%08x\n", $stack_end
    printf "Stack Used:    %d bytes\n", $stack_used
    printf "Remaining:     %d bytes\n", $stack_remaining
    printf "Total Stack:   %d bytes\n", $stack_total

    set $percent_used = ($stack_used * 100) / $stack_total
    printf "Current Usage: %d%%\n\n", $percent_used
end
