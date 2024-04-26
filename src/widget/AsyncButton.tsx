import { useState } from 'react';
import { Button, ButtonProps } from 'antd';

function isPromise(value: unknown): value is Promise<unknown> {
    // ref: https://stackoverflow.com/questions/27746304/how-do-i-tell-if-an-object-is-a-promise

    return (
        typeof value === 'object' &&
        value !== null &&
        'then' in value &&
        typeof (value as { then: unknown }).then === 'function'
    );
}

export default function AsyncButton({
    onClick,
    loading: primitiveLoading,
    ...restProps
}: ButtonProps) {
    const [isHandlingClick, setHandlingClick] = useState<boolean>(false);

    return (
        <Button
            {...restProps}
            loading={primitiveLoading === undefined ? isHandlingClick : primitiveLoading}
            onClick={async (...args) => {
                if (typeof onClick === 'function' && !isHandlingClick) {
                    const returnValue = onClick(...args) as unknown;

                    if (isPromise(returnValue)) {
                        // If "onClick" function return a Promise
                        // According to the status of Promise, switch loading automatically.
                        try {
                            setHandlingClick(true);
                            await returnValue;
                            setHandlingClick(false);
                        } catch (e) {
                            setHandlingClick(false);
                            throw e;
                        }
                    }
                }
            }}
        />
    );
}
