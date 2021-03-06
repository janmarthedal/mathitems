import * as mjAPI from 'mathjax-node';
import mjConfig from './mathjax-config';

mjAPI.config(mjConfig);
mjAPI.start();

export default function typeset(id, data): Promise<any[]> {
    if (data.error)
        return Promise.resolve([id, data]);
    if (['TeX', 'inline-TeX'].indexOf(data.format) < 0)
        return Promise.reject('illegal typeset format');
    return new Promise((resolve) => {
        mjAPI.typeset({
            math: data.math,
            format: data.format,
            html: true,
        }, result => {
            resolve([id, result.errors
                ? {error: result.errors.join('; ')}
                : {format: data.format, math: data.math, html: result.html}]);
        });
    });
}
